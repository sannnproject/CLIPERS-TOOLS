import type { Highlight, HighlightScore, SubtitleCue } from "./types";

const KEYWORDS = [
  "best",
  "crazy",
  "insane",
  "secret",
  "never",
  "wow",
  "amazing",
  "important",
  "money",
  "win",
  "lose",
  "first",
  "last",
  "why",
  "how",
  "actually",
];

export interface AudioAnalysis {
  duration: number;
  /** RMS energy per bucket, normalised 0..1 */
  envelope: number[];
  bucketSeconds: number;
  peaks: number[];
  silenceRatio: number[];
}

/** Decodes a WAV buffer and builds a normalised loudness envelope. */
export async function analyzeAudio(wav: Uint8Array, bucketSeconds = 0.5): Promise<AudioAnalysis> {
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio API unavailable");
  const context = new AudioContextClass();
  const copy = new Uint8Array(wav.length);
  copy.set(wav);
  const buffer = await context.decodeAudioData(copy.buffer as ArrayBuffer);
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const bucketSize = Math.max(1, Math.floor(sampleRate * bucketSeconds));
  const envelope: number[] = [];
  const silenceRatio: number[] = [];
  const silenceThreshold = 0.015;

  for (let offset = 0; offset < data.length; offset += bucketSize) {
    let sum = 0;
    let silent = 0;
    const end = Math.min(data.length, offset + bucketSize);
    for (let i = offset; i < end; i += 1) {
      const value = Math.abs(data[i] ?? 0);
      sum += value * value;
      if (value < silenceThreshold) silent += 1;
    }
    const count = end - offset;
    envelope.push(Math.sqrt(sum / count));
    silenceRatio.push(silent / count);
  }

  const max = Math.max(...envelope, 1e-6);
  const normalised = envelope.map((value) => value / max);
  const mean = normalised.reduce((a, b) => a + b, 0) / Math.max(1, normalised.length);
  const peaks = normalised.map((value) => Math.max(0, value - mean) / Math.max(1e-6, 1 - mean));

  await context.close();
  return {
    duration: buffer.duration,
    envelope: normalised,
    bucketSeconds,
    peaks,
    silenceRatio,
  };
}

/** Samples frames from a video element and measures inter-frame difference. */
export async function analyzeMotion(
  file: Blob,
  duration: number,
  samples = 36,
  onProgress?: (ratio: number) => void,
): Promise<{ times: number[]; motion: number[] }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  const times: number[] = [];
  const motion: number[] = [];

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Unable to decode video for motion analysis"));
    });

    const width = 80;
    const height = 45;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas 2D unavailable");

    let previous: Uint8ClampedArray | null = null;
    for (let i = 0; i < samples; i += 1) {
      const time = (duration * (i + 0.5)) / samples;
      await seek(video, time);
      ctx.drawImage(video, 0, 0, width, height);
      const frame = ctx.getImageData(0, 0, width, height).data;
      if (previous) {
        let diff = 0;
        for (let p = 0; p < frame.length; p += 4) {
          diff +=
            Math.abs((frame[p] ?? 0) - (previous[p] ?? 0)) +
            Math.abs((frame[p + 1] ?? 0) - (previous[p + 1] ?? 0));
        }
        motion.push(diff / (frame.length / 4) / 510);
      } else {
        motion.push(0);
      }
      previous = new Uint8ClampedArray(frame);
      times.push(time);
      onProgress?.((i + 1) / samples);
    }
  } finally {
    video.src = "";
    URL.revokeObjectURL(url);
  }

  const max = Math.max(...motion, 1e-6);
  return { times, motion: motion.map((value) => value / max) };
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.currentTime = Math.max(0, time);
  });
}

export interface ScoreInput {
  audio: AudioAnalysis;
  motion: { times: number[]; motion: number[] };
  cues: SubtitleCue[];
  duration: number;
  clipLength: number;
  clipCount: number;
}

/** Windowed highlight scoring with diversity-aware selection. */
export function detectHighlights({
  audio,
  motion,
  cues,
  duration,
  clipLength,
  clipCount,
}: ScoreInput): Highlight[] {
  // Never ask for a clip longer than the source video.
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : clipLength;
  const length = Math.max(1, Math.min(clipLength, safeDuration));
  const step = Math.max(1, Math.round(length / 4));
  const candidates: Highlight[] = [];

  for (let start = 0; start + length <= Math.max(length, safeDuration); start += step) {
    const end = Math.min(start + length, safeDuration);
    const from = Math.floor(start / audio.bucketSeconds);
    const to = Math.max(from + 1, Math.floor(end / audio.bucketSeconds));

    const slice = audio.envelope.slice(from, to);
    const peakSlice = audio.peaks.slice(from, to);
    const silenceSlice = audio.silenceRatio.slice(from, to);
    if (slice.length === 0) continue;

    const loudness = average(slice);
    const peakScore = Math.max(...peakSlice, 0);
    const speech = slice.filter((value) => value > 0.18).length / slice.length;
    const silence = 1 - average(silenceSlice);
    const motionScore = averageInRange(motion.times, motion.motion, start, end);
    const keywords = keywordScore(cues, start, end);

    const parts: HighlightScore = {
      audio: clamp(peakScore * 0.6 + loudness * 0.4),
      speech: clamp(speech),
      silence: clamp(silence),
      motion: clamp(motionScore),
      keywords: clamp(keywords),
    };

    const score = clamp(
      parts.audio * 0.32 + parts.speech * 0.24 + parts.silence * 0.14 + parts.motion * 0.2 + parts.keywords * 0.1,
    );

    candidates.push({ id: `${start.toFixed(2)}-${end.toFixed(2)}`, start, end, score, parts });
  }

  candidates.sort((a, b) => b.score - a.score);

  const picked: Highlight[] = [];
  const minGap = length * 0.9;
  for (const candidate of candidates) {
    if (picked.length >= clipCount) break;
    const overlaps = picked.some((item) => Math.abs(item.start - candidate.start) < minGap);
    if (!overlaps) picked.push(candidate);
  }
  const fallback = candidates[0];
  if (picked.length === 0 && fallback) picked.push(fallback);

  return picked.sort((a, b) => a.start - b.start);
}

function keywordScore(cues: SubtitleCue[], start: number, end: number): number {
  const text = cues
    .filter((cue) => cue.end > start && cue.start < end)
    .map((cue) => cue.text.toLowerCase())
    .join(" ");
  if (!text) return 0;
  const hits = KEYWORDS.filter((word) => text.includes(word)).length;
  const density = text.split(/\s+/).length / Math.max(1, end - start);
  return clamp(hits / 4 + Math.min(1, density / 4) * 0.5);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function averageInRange(times: number[], values: number[], start: number, end: number): number {
  const selected = values.filter((_, index) => {
    const time = times[index];
    return time !== undefined && time >= start && time <= end;
  });
  return average(selected);
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

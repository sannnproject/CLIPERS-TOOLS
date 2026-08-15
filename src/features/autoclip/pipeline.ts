import { getEngine } from "./engine";
import { analyzeAudio, analyzeMotion, detectHighlights, type AudioAnalysis } from "./analysis";
import { buildAss, sliceCues } from "./subtitles";
import {
  ASPECT_RATIO_VALUE,
  QUALITY_HEIGHT,
  type ClipConfig,
  type ClipResult,
  type Highlight,
  type PipelineStage,
  type SubtitleCue,
} from "./types";

export interface PipelineCallbacks {
  onStage: (stage: PipelineStage, detail?: string) => void;
  onProgress: (ratio: number) => void;
  onLog?: (line: string) => void;
  onClip?: (clip: ClipResult) => void;
  onWarning?: (message: string) => void;
  shouldCancel?: () => boolean;
}

export interface PipelineInput {
  file: Blob;
  fileName: string;
  duration: number;
  config: ClipConfig;
  cues: SubtitleCue[];
}

export interface PipelineOutput {
  clips: ClipResult[];
  highlights: Highlight[];
  analysis: AudioAnalysis | null;
}

const EXT_ARGS: Record<ClipConfig["format"], { ext: string; args: string[] }> = {
  mp4: {
    ext: "mp4",
    args: [
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "zerolatency",
      "-crf",
      "28",
      "-g",
      "60",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-ac",
      "1",
      "-movflags",
      "+faststart",
    ],
  },
  webm: {
    ext: "webm",
    args: [
      "-c:v",
      "libvpx",
      "-b:v",
      "1M",
      "-deadline",
      "realtime",
      "-cpu-used",
      "8",
      "-c:a",
      "libvorbis",
      "-ac",
      "1",
    ],
  },
  gif: { ext: "gif", args: ["-an", "-loop", "0"] },
};

/**
 * Seconds of extra decode before the requested start. Seeking before `-i` is a
 * fast keyframe seek, so we land slightly early and trim the remainder with an
 * accurate output-side `-ss` — fast *and* frame accurate.
 */
const SEEK_PREROLL = 1.2;

class Cancelled extends Error {
  constructor() {
    super("Cancelled");
  }
}

/** Full browser-side pipeline: analyze -> score -> cut -> style -> export. */
export async function runPipeline(input: PipelineInput, callbacks: PipelineCallbacks): Promise<PipelineOutput> {
  const { file, config, duration } = input;
  const guard = () => {
    if (callbacks.shouldCancel?.()) throw new Cancelled();
  };

  callbacks.onStage("loading-engine");
  callbacks.onProgress(0.02);
  const engine = await getEngine(callbacks.onLog);
  guard();

  const inputName = "source.input";
  const bytes = new Uint8Array(await file.arrayBuffer());
  await engine.writeFile(inputName, bytes);

  callbacks.onStage("extract-audio");
  callbacks.onProgress(0.1);
  await engine.exec(["-i", inputName, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", "audio.wav"]);
  guard();

  callbacks.onStage("analyze-audio");
  callbacks.onProgress(0.2);
  const wav = (await engine.readFile("audio.wav")) as Uint8Array;
  const audio = await analyzeAudio(wav);
  guard();

  callbacks.onStage("analyze-motion");
  const motion = await analyzeMotion(file, duration || audio.duration, 30, (ratio) => {
    callbacks.onProgress(0.2 + ratio * 0.2);
  });
  guard();

  callbacks.onStage("scoring");
  callbacks.onProgress(0.42);
  const highlights = detectHighlights({
    audio,
    motion,
    cues: input.cues,
    duration: duration || audio.duration,
    clipLength: config.clipLength,
    clipCount: config.clipCount,
  });

  const ratio = ASPECT_RATIO_VALUE[config.aspect];
  const height = QUALITY_HEIGHT[config.quality];
  const width = even(Math.round(height * ratio));

  if (config.watermark.dataUrl) {
    await engine.writeFile("logo.png", await dataUrlToBytes(config.watermark.dataUrl));
  }

  const clips: ClipResult[] = [];
  let subtitleFailed = false;

  for (let index = 0; index < highlights.length; index += 1) {
    guard();
    const highlight = highlights[index];
    if (!highlight) continue;

    callbacks.onStage("cutting", `Clip ${index + 1} of ${highlights.length}`);
    const base = 0.45 + (index / highlights.length) * 0.5;
    callbacks.onProgress(base);

    const clipCues = sliceCues(input.cues, highlight.start, highlight.end);
    const wantsSubtitles = config.subtitle.enabled && clipCues.length > 0 && !subtitleFailed;
    if (wantsSubtitles) {
      callbacks.onStage("subtitles", `Clip ${index + 1}`);
      await engine.writeFile("sub.ass", new TextEncoder().encode(buildAss(clipCues, config.subtitle, width, height)));
    }

    const output = `clip-${index + 1}.${EXT_ARGS[config.format].ext}`;
    let blob: Blob | null = null;

    for (const withSubtitles of wantsSubtitles ? [true, false] : [false]) {
      try {
        await engine.exec(
          buildArgs({
            inputName,
            output,
            start: highlight.start,
            duration: highlight.end - highlight.start,
            width,
            height,
            ratio,
            config,
            withSubtitles,
          }),
        );
        const data = (await engine.readFile(output)) as Uint8Array;
        const copy = new Uint8Array(data.length);
        copy.set(data);
        blob = new Blob([copy], { type: mimeFor(config.format) });
        break;
      } catch (error) {
        if (withSubtitles) {
          subtitleFailed = true;
          callbacks.onWarning?.(
            "Subtitle burn-in is not supported by this browser build — clips were exported without burned captions.",
          );
          continue;
        }
        throw error;
      }
    }

    if (!blob) continue;

    const result: ClipResult = {
      id: crypto.randomUUID(),
      name: `${stripExtension(input.fileName)}-clip-${index + 1}.${EXT_ARGS[config.format].ext}`,
      start: highlight.start,
      end: highlight.end,
      score: highlight.score,
      parts: highlight.parts,
      aspect: config.aspect,
      format: config.format,
      size: blob.size,
      blob,
      url: URL.createObjectURL(blob),
      createdAt: Date.now(),
    };
    clips.push(result);
    callbacks.onClip?.(result);
    await engine.deleteFile(output).catch(() => undefined);
  }

  callbacks.onStage("done");
  callbacks.onProgress(1);
  await engine.deleteFile(inputName).catch(() => undefined);
  await engine.deleteFile("audio.wav").catch(() => undefined);

  return { clips, highlights, analysis: audio };
}

interface ArgsInput {
  inputName: string;
  output: string;
  start: number;
  duration: number;
  width: number;
  height: number;
  ratio: number;
  config: ClipConfig;
  withSubtitles: boolean;
}

function buildArgs({
  inputName,
  output,
  start,
  duration,
  width,
  height,
  ratio,
  config,
  withSubtitles,
}: ArgsInput): string[] {
  const fps = config.format === "gif" ? 12 : config.fps;
  // Drop frames first so crop/scale only run on frames we actually keep.
  const chain = [
    `fps=${fps}`,
    `crop='if(gte(iw/ih,${ratio}),ih*${ratio},iw)':'if(gte(iw/ih,${ratio}),ih,iw/${ratio})'`,
    `scale=${width}:${height}:flags=fast_bilinear`,
  ];
  if (withSubtitles) chain.push("subtitles=sub.ass");

  // Fast keyframe seek before -i, accurate trim after it.
  const coarse = Math.max(0, start - SEEK_PREROLL);
  const fine = start - coarse;
  const args = ["-ss", coarse.toFixed(3), "-i", inputName];
  const watermark = config.watermark;

  if (watermark.dataUrl) {
    args.push("-i", "logo.png");
    const logoWidth = even(Math.max(24, Math.round((width * watermark.size) / 100)));
    const margin = Math.round(width * 0.04);
    const overlay = overlayPosition(watermark.position, margin);
    args.push(
      "-filter_complex",
      `[0:v]${chain.join(",")}[base];[1:v]scale=${logoWidth}:-1,format=rgba,colorchannelmixer=aa=${watermark.opacity.toFixed(2)}[wm];[base][wm]overlay=${overlay}:shortest=1[v]`,
      "-map",
      "[v]",
    );
    if (config.format !== "gif") args.push("-map", "0:a?");
  } else {
    args.push("-vf", chain.join(","));
  }

  if (fine > 0.001) args.push("-ss", fine.toFixed(3));
  args.push("-t", duration.toFixed(3));
  args.push("-sn", "-dn", "-map_metadata", "-1", "-threads", "0");
  args.push(...EXT_ARGS[config.format].args, "-y", output);
  return args;
}

function overlayPosition(position: ClipConfig["watermark"]["position"], margin: number): string {
  switch (position) {
    case "top-left":
      return `${margin}:${margin}`;
    case "top-right":
      return `W-w-${margin}:${margin}`;
    case "bottom-left":
      return `${margin}:H-h-${margin}`;
    case "center":
      return "(W-w)/2:(H-h)/2";
    default:
      return `W-w-${margin}:H-h-${margin}`;
  }
}

function mimeFor(format: ClipConfig["format"]): string {
  if (format === "webm") return "video/webm";
  if (format === "gif") return "image/gif";
  return "video/mp4";
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "").slice(0, 40) || "autoclip";
}

function even(value: number): number {
  return value % 2 === 0 ? value : value + 1;
}

export function isCancellation(error: unknown): boolean {
  return error instanceof Cancelled;
}

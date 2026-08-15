import type { SubtitleCue, SubtitleStyle } from "./types";

const TIME_PATTERN = /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/g;

/** Parses SRT or WebVTT text into cues. Unknown lines are ignored. */
export function parseSubtitles(input: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = input.replace(/\r/g, "").split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;
    const timingLine = lines.find((line) => line.includes("-->"));
    if (!timingLine) continue;
    const matches = [...timingLine.matchAll(TIME_PATTERN)];
    const [openMatch, closeMatch] = matches;
    if (!openMatch || !closeMatch) continue;
    const text = lines
      .filter((line) => line !== timingLine && !/^\d+$/.test(line.trim()) && !line.startsWith("WEBVTT"))
      .join(" ")
      .trim();
    if (!text) continue;
    cues.push({ start: toSeconds(openMatch), end: toSeconds(closeMatch), text });
  }

  return cues.sort((a, b) => a.start - b.start);
}

function toSeconds(match: RegExpMatchArray): number {
  const [, h = "0", m = "0", s = "0", ms = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
}

export function sliceCues(cues: SubtitleCue[], start: number, end: number): SubtitleCue[] {
  return cues
    .filter((cue) => cue.end > start && cue.start < end)
    .map((cue) => ({
      start: Math.max(0, cue.start - start),
      end: Math.min(end - start, cue.end - start),
      text: cue.text,
    }));
}

const ALIGNMENT: Record<SubtitleStyle["position"], number> = { bottom: 2, center: 5, top: 8 };

/** Builds an ASS subtitle file that ffmpeg.wasm can burn into a clip. */
export function buildAss(cues: SubtitleCue[], style: SubtitleStyle, width: number, height: number): string {
  const outline = style.stroke;
  const borderStyle = style.background ? 3 : 1;
  const shadow = style.shadow ? 2 : 0;
  const marginV = style.position === "center" ? 0 : Math.round(height * 0.08);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Sans,${style.fontSize},&H00FFFFFF,&H00000000,&H80000000,${style.bold ? -1 : 0},0,${borderStyle},${outline},${shadow},${ALIGNMENT[style.position]},60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = cues
    .map((cue) => {
      const text = style.highlightWords ? karaoke(cue) : escapeText(cue.text);
      return `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Main,,0,0,0,,${text}`;
    })
    .join("\n");

  return `${header}${events}\n`;
}

function karaoke(cue: SubtitleCue): string {
  const words = cue.text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const perWord = Math.max(8, Math.round(((cue.end - cue.start) * 100) / words.length));
  return words.map((word) => `{\\k${perWord}}${escapeText(word)}`).join(" ");
}

function escapeText(text: string): string {
  return text.replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

function assTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.floor((clamped % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

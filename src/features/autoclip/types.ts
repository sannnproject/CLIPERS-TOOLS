export type Quality = "360p" | "480p" | "720p" | "1080p";
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type ExportFormat = "mp4" | "webm" | "gif";
export type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
export type SubtitlePosition = "top" | "center" | "bottom";

export interface WatermarkConfig {
  dataUrl: string | null;
  opacity: number;
  size: number;
  position: WatermarkPosition;
}

export interface SubtitleStyle {
  enabled: boolean;
  fontSize: number;
  bold: boolean;
  stroke: number;
  shadow: boolean;
  background: boolean;
  position: SubtitlePosition;
  highlightWords: boolean;
}

export interface ClipConfig {
  quality: Quality;
  clipLength: number;
  clipCount: number;
  aspect: AspectRatio;
  subtitle: SubtitleStyle;
  watermark: WatermarkConfig;
  format: ExportFormat;
  fps: 30 | 60;
}

export interface SourceMeta {
  kind: "file" | "youtube";
  title: string;
  thumbnail: string | null;
  duration: number;
  url?: string;
  fileName?: string;
  fileSize?: number;
}

export interface HighlightScore {
  audio: number;
  speech: number;
  silence: number;
  motion: number;
  keywords: number;
}

export interface Highlight {
  id: string;
  start: number;
  end: number;
  score: number;
  parts: HighlightScore;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export type PipelineStage =
  | "idle"
  | "source"
  | "loading-engine"
  | "extract-audio"
  | "analyze-audio"
  | "analyze-motion"
  | "scoring"
  | "cutting"
  | "subtitles"
  | "exporting"
  | "done"
  | "error";

export const STAGE_LABEL: Record<PipelineStage, string> = {
  idle: "Waiting",
  source: "Reading source",
  "loading-engine": "Loading ffmpeg.wasm engine",
  "extract-audio": "Extracting audio track",
  "analyze-audio": "Analyzing volume, peaks and silence",
  "analyze-motion": "Analyzing scene motion",
  scoring: "Generating highlight scores",
  cutting: "Cutting clips",
  subtitles: "Burning subtitles",
  exporting: "Exporting",
  done: "Finished",
  error: "Failed",
};

export interface ClipResult {
  id: string;
  name: string;
  start: number;
  end: number;
  score: number;
  parts: HighlightScore;
  aspect: AspectRatio;
  format: ExportFormat;
  size: number;
  blob: Blob;
  url: string;
  createdAt: number;
}

export const QUALITY_HEIGHT: Record<Quality, number> = {
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
};

export const ASPECT_RATIO_VALUE: Record<AspectRatio, number> = {
  "9:16": 9 / 16,
  "1:1": 1,
  "16:9": 16 / 9,
};

export const DEFAULT_CONFIG: ClipConfig = {
  quality: "720p",
  clipLength: 30,
  clipCount: 3,
  aspect: "9:16",
  subtitle: {
    enabled: false,
    fontSize: 42,
    bold: true,
    stroke: 3,
    shadow: true,
    background: false,
    position: "bottom",
    highlightWords: true,
  },
  watermark: {
    dataUrl: null,
    opacity: 0.7,
    size: 14,
    position: "bottom-right",
  },
  format: "mp4",
  fps: 30,
};

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

import { create } from "zustand";
import {
  DEFAULT_CONFIG,
  type ClipConfig,
  type ClipResult,
  type Highlight,
  type PipelineStage,
  type SourceMeta,
  type SubtitleCue,
} from "./types";

interface AutoClipState {
  step: number;
  source: SourceMeta | null;
  file: Blob | null;
  config: ClipConfig;
  cues: SubtitleCue[];
  transcriptName: string | null;
  stage: PipelineStage;
  detail: string;
  progress: number;
  logs: string[];
  clips: ClipResult[];
  highlights: Highlight[];
  error: string | null;
  cancelRequested: boolean;
  setStep: (step: number) => void;
  setSource: (source: SourceMeta | null, file: Blob | null) => void;
  patchConfig: (patch: Partial<ClipConfig>) => void;
  patchSubtitle: (patch: Partial<ClipConfig["subtitle"]>) => void;
  patchWatermark: (patch: Partial<ClipConfig["watermark"]>) => void;
  setCues: (cues: SubtitleCue[], name: string | null) => void;
  setStage: (stage: PipelineStage, detail?: string) => void;
  setProgress: (progress: number) => void;
  pushLog: (line: string) => void;
  addClip: (clip: ClipResult) => void;
  setClips: (clips: ClipResult[]) => void;
  setHighlights: (highlights: Highlight[]) => void;
  setError: (error: string | null) => void;
  requestCancel: () => void;
  resetRun: () => void;
  resetAll: () => void;
}

export const useAutoClipStore = create<AutoClipState>((set) => ({
  step: 1,
  source: null,
  file: null,
  config: DEFAULT_CONFIG,
  cues: [],
  transcriptName: null,
  stage: "idle",
  detail: "",
  progress: 0,
  logs: [],
  clips: [],
  highlights: [],
  error: null,
  cancelRequested: false,
  setStep: (step) => set({ step }),
  setSource: (source, file) => set({ source, file, step: source ? 2 : 1 }),
  patchConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  patchSubtitle: (patch) =>
    set((state) => ({ config: { ...state.config, subtitle: { ...state.config.subtitle, ...patch } } })),
  patchWatermark: (patch) =>
    set((state) => ({ config: { ...state.config, watermark: { ...state.config.watermark, ...patch } } })),
  setCues: (cues, transcriptName) => set({ cues, transcriptName }),
  setStage: (stage, detail = "") => set({ stage, detail }),
  setProgress: (progress) => set({ progress }),
  pushLog: (line) => set((state) => ({ logs: [...state.logs.slice(-120), line] })),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  setClips: (clips) => set({ clips }),
  setHighlights: (highlights) => set({ highlights }),
  setError: (error) => set({ error }),
  requestCancel: () => set({ cancelRequested: true }),
  resetRun: () =>
    set({ stage: "idle", detail: "", progress: 0, clips: [], highlights: [], error: null, cancelRequested: false, logs: [] }),
  resetAll: () =>
    set({
      step: 1,
      source: null,
      file: null,
      cues: [],
      transcriptName: null,
      stage: "idle",
      detail: "",
      progress: 0,
      clips: [],
      highlights: [],
      error: null,
      cancelRequested: false,
      logs: [],
    }),
}));

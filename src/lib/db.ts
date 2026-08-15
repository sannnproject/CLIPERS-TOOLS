import Dexie, { type EntityTable } from "dexie";
import type { AspectRatio, ClipConfig, ExportFormat, HighlightScore, SourceMeta } from "@/features/autoclip/types";

export interface ProjectRecord {
  id: string;
  name: string;
  source: SourceMeta;
  config: ClipConfig;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  clipCount: number;
}

export interface ClipRecord {
  id: string;
  projectId: string;
  name: string;
  start: number;
  end: number;
  score: number;
  parts: HighlightScore;
  aspect: AspectRatio;
  format: ExportFormat;
  size: number;
  blob: Blob;
  createdAt: number;
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  config: ClipConfig;
  builtIn: boolean;
  createdAt: number;
}

export interface PreferenceRecord {
  key: string;
  value: string;
}

class AutoClipDatabase extends Dexie {
  projects!: EntityTable<ProjectRecord, "id">;
  clips!: EntityTable<ClipRecord, "id">;
  templates!: EntityTable<TemplateRecord, "id">;
  preferences!: EntityTable<PreferenceRecord, "key">;

  constructor() {
    super("autoclip-ai");
    this.version(1).stores({
      projects: "id, createdAt, favorite, name",
      clips: "id, projectId, createdAt, score",
      templates: "id, name, createdAt",
      preferences: "key",
    });
  }
}

let instance: AutoClipDatabase | null = null;

/** Browser-only: never call during SSR or module evaluation. */
export function db(): AutoClipDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!instance) instance = new AutoClipDatabase();
  return instance;
}

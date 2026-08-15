import { useCallback, useEffect, useState } from "react";
import { db, type ClipRecord, type ProjectRecord } from "@/lib/db";
import type { ClipConfig, ClipResult, SourceMeta } from "./types";

export function useLiveProjects() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [clips, setClips] = useState<ClipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const database = db();
    const [nextProjects, nextClips] = await Promise.all([
      database.projects.orderBy("createdAt").reverse().toArray(),
      database.clips.orderBy("createdAt").reverse().toArray(),
    ]);
    setProjects(nextProjects);
    setClips(nextClips);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, clips, loading, refresh };
}

export async function saveRun(
  source: SourceMeta,
  config: ClipConfig,
  clips: ClipResult[],
): Promise<string> {
  const database = db();
  const projectId = crypto.randomUUID();
  const now = Date.now();

  await database.projects.add({
    id: projectId,
    name: source.title || source.fileName || "Untitled project",
    source,
    config,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    clipCount: clips.length,
  });

  await database.clips.bulkAdd(
    clips.map((clip) => ({
      id: clip.id,
      projectId,
      name: clip.name,
      start: clip.start,
      end: clip.end,
      score: clip.score,
      parts: clip.parts,
      aspect: clip.aspect,
      format: clip.format,
      size: clip.size,
      blob: clip.blob,
      createdAt: clip.createdAt,
    })),
  );

  return projectId;
}

export async function deleteProject(projectId: string): Promise<void> {
  const database = db();
  await database.clips.where("projectId").equals(projectId).delete();
  await database.projects.delete(projectId);
}

export async function renameProject(projectId: string, name: string): Promise<void> {
  await db().projects.update(projectId, { name, updatedAt: Date.now() });
}

export async function toggleFavorite(project: ProjectRecord): Promise<void> {
  await db().projects.update(project.id, { favorite: !project.favorite });
}

export async function clipsForProject(projectId: string): Promise<ClipRecord[]> {
  const rows = await db().clips.where("projectId").equals(projectId).toArray();
  return rows.sort((a, b) => a.start - b.start);
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Star, Trash2 } from "lucide-react";
import {
  deleteProject,
  downloadBlob,
  renameProject,
  toggleFavorite,
  useLiveProjects,
} from "@/features/autoclip/useLibrary";
import { formatBytes, formatDuration } from "@/features/autoclip/types";

export const Route = createFileRoute("/dashboard/history")({
  head: () => ({
    meta: [
      { title: "History — AutoClip AI" },
      { name: "description", content: "Every local project and exported clip, stored in your browser's IndexedDB." },
      { property: "og:title", content: "History — AutoClip AI" },
      { property: "og:description", content: "Browse, rename, favorite and delete your local clip projects." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { projects, clips, loading, refresh } = useLiveProjects();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Projects and exports saved on this device.</p>
      </header>

      {loading ? (
        <div className="mt-8 h-40 rounded-3xl glass shimmer" />
      ) : projects.length === 0 ? (
        <p className="mt-8 rounded-3xl glass p-8 text-center text-sm text-muted-foreground">
          No exports yet.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {projects.map((project) => {
            const projectClips = clips.filter((clip) => clip.projectId === project.id);
            return (
              <article key={project.id} className="rounded-3xl glass p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{project.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleString()} · {formatDuration(project.source.duration)} source ·{" "}
                      {project.config.quality} · {project.config.aspect}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      aria-label="Toggle favorite"
                      onClick={async () => {
                        await toggleFavorite(project);
                        await refresh();
                      }}
                    >
                      <Star className={`size-4 ${project.favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={async () => {
                        const name = window.prompt("Rename project", project.name);
                        if (!name) return;
                        await renameProject(project.id, name);
                        await refresh();
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive"
                      aria-label="Delete project"
                      onClick={async () => {
                        await deleteProject(project.id);
                        await refresh();
                        toast.success("Project deleted");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {projectClips.map((clip) => (
                    <li
                      key={clip.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{clip.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {formatDuration(clip.start)} → {formatDuration(clip.end)} · {formatBytes(clip.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full font-mono text-[10px]">
                          {Math.round(clip.score * 100)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label={`Download ${clip.name}`}
                          onClick={() => downloadBlob(clip.blob, clip.name)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

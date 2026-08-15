import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clapperboard, Film, HardDrive, Wand2 } from "lucide-react";
import { useLiveProjects } from "@/features/autoclip/useLibrary";
import { formatBytes, formatDuration } from "@/features/autoclip/types";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AutoClip AI" },
      { name: "description", content: "Your local clip projects, exports and storage usage at a glance." },
      { property: "og:title", content: "Dashboard — AutoClip AI" },
      { property: "og:description", content: "Local clip projects, exports and storage usage." },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { projects, clips, loading } = useLiveProjects();
  const totalBytes = clips.reduce((sum, clip) => sum + clip.size, 0);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything below is stored on this device only.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/dashboard/auto-clip">
            <Wand2 className="size-4" /> New auto clip
          </Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Film} label="Projects" value={loading ? "—" : String(projects.length)} />
        <StatCard icon={Clapperboard} label="Clips exported" value={loading ? "—" : String(clips.length)} />
        <StatCard icon={HardDrive} label="Local storage" value={loading ? "—" : formatBytes(totalBytes)} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent projects</h2>
          <Link
            to="/dashboard/history"
            className="focus-ring flex items-center gap-1 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View history <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((key) => (
              <div key={key} className="h-28 rounded-3xl glass shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-4 rounded-3xl glass p-8 text-center">
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Drop in a video and AutoClip AI will score it, cut the strongest moments and reframe them for shorts.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/dashboard/auto-clip">Start your first clip</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {projects.slice(0, 6).map((project) => (
              <article key={project.id} className="rounded-3xl glass p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDuration(project.source.duration)} source · {project.clipCount} clips ·{" "}
                      {project.config.aspect} · {project.config.quality}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                  <Link to="/dashboard/editor" search={{ project: project.id }}>
                    Open in editor
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Film;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl glass p-5">
      <span className="flex size-9 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AutoClip AI" },
      {
        name: "description",
        content: "Why AutoClip AI processes video locally with ffmpeg.wasm instead of uploading it to render servers.",
      },
      { property: "og:title", content: "About — AutoClip AI" },
      { property: "og:description", content: "Local-first short-form clipping built on WebAssembly." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">About AutoClip AI</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          AutoClip AI turns long-form video into short vertical clips without a render farm. Decoding, analysis and
          encoding all happen inside your browser tab using ffmpeg.wasm, the Web Audio API and canvas frame sampling.
        </p>
        <p>
          Highlight detection is a transparent scoring function, not a black box: loudness peaks, speech density,
          silence gaps, inter-frame motion and caption keywords are combined, then diversity rules stop the same moment
          from being cut twice.
        </p>
        <p>
          Because nothing is uploaded, there is no account, no tracking, and no analytics. Projects, clips, templates
          and preferences live in IndexedDB and local storage on your machine, and the whole app deploys as static
          assets.
        </p>
      </div>
      <div className="mt-8 flex gap-3">
        <Button asChild className="rounded-full">
          <Link to="/dashboard/auto-clip">Start clipping</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    </main>
  );
}

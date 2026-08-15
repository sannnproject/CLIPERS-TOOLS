import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Download, Pause, Play, Redo2, Scissors, SkipBack, SkipForward, Trash2, Undo2 } from "lucide-react";
import { useLiveProjects, downloadBlob } from "@/features/autoclip/useLibrary";
import { formatBytes, formatDuration } from "@/features/autoclip/types";
import type { ClipRecord } from "@/lib/db";

export const Route = createFileRoute("/dashboard/editor")({
  head: () => ({
    meta: [
      { title: "Editor — AutoClip AI" },
      { name: "description", content: "Trim, preview and re-export generated clips with a keyboard-driven timeline." },
      { property: "og:title", content: "Editor — AutoClip AI" },
      { property: "og:description", content: "Trim and preview your generated clips locally." },
    ],
  }),
  component: EditorPage,
});

interface Trim {
  start: number;
  end: number;
}

function EditorPage() {
  const { clips, loading } = useLiveProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trim, setTrim] = useState<Trim>({ start: 0, end: 0 });
  const [history, setHistory] = useState<Trim[]>([]);
  const [future, setFuture] = useState<Trim[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const selected: ClipRecord | undefined = clips.find((clip) => clip.id === selectedId) ?? clips[0];
  const url = useObjectUrl(selected?.blob);

  useEffect(() => {
    setTrim({ start: 0, end: 0 });
    setHistory([]);
    setFuture([]);
  }, [selected?.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const video = videoRef.current;
      if (event.code === "Space") {
        event.preventDefault();
        if (!video) return;
        if (video.paused) void video.play();
        else video.pause();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        toast.success("Clips are saved locally as you generate them.");
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const commit = (next: Trim) => {
    setHistory((items) => [...items, trim]);
    setFuture([]);
    setTrim(next);
  };

  const undo = () => {
    setHistory((items) => {
      const previous = items[items.length - 1];
      if (!previous) return items;
      setFuture((f) => [trim, ...f]);
      setTrim(previous);
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((items) => {
      const next = items[0];
      if (!next) return items;
      setHistory((h) => [...h, trim]);
      setTrim(next);
      return items.slice(1);
    });
  };

  if (loading) {
    return <div className="mx-auto h-64 w-full max-w-5xl rounded-3xl glass shimmer" />;
  }

  if (!selected || !url) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl glass p-8 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Nothing to edit yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate clips in Auto Clip and they'll show up here with a timeline.
        </p>
      </div>
    );
  }

  const effectiveEnd = trim.end || duration;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trim in-browser, then download the clip. Space plays, ⌘Z undoes.
        </p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-3xl glass p-4">
          <video
            ref={videoRef}
            src={url}
            className="w-full rounded-2xl bg-black"
            onLoadedMetadata={(event) => {
              const value = event.currentTarget.duration;
              setDuration(value);
              setTrim((current) => ({ start: current.start, end: current.end || value }));
            }}
            onTimeUpdate={(event) => {
              const current = event.currentTarget.currentTime;
              setTime(current);
              if (effectiveEnd && current > effectiveEnd) event.currentTarget.pause();
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            playsInline
            controls={false}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="icon"
              className="rounded-full"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                if (video.paused) void video.play();
                else video.pause();
              }}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label="Step back one frame"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = Math.max(0, time - 1 / 30);
              }}
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label="Step forward one frame"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = Math.min(duration, time + 1 / 30);
              }}
            >
              <SkipForward className="size-4" />
            </Button>
            <Badge variant="secondary" className="rounded-full font-mono text-xs">
              {formatDuration(time)} / {formatDuration(duration)}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setSpeed(rate);
                    if (videoRef.current) videoRef.current.playbackRate = rate;
                  }}
                  className={`focus-ring rounded-full px-3 py-1 text-xs ${
                    speed === rate ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs text-muted-foreground">
              Trim {formatDuration(trim.start)} → {formatDuration(effectiveEnd)}
            </p>
            <Slider
              className="mt-3"
              value={[trim.start, effectiveEnd]}
              min={0}
              max={Math.max(1, duration)}
              step={0.05}
              onValueChange={(next) => {
                const [start = 0, end = duration] = next;
                setTrim({ start, end });
              }}
              onValueCommit={(next) => {
                const [start = 0, end = duration] = next;
                commit({ start, end });
                if (videoRef.current) videoRef.current.currentTime = start;
              }}
              aria-label="Trim range"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={undo} disabled={history.length === 0}>
              <Undo2 className="size-4" /> Undo
            </Button>
            <Button variant="outline" className="rounded-full" onClick={redo} disabled={future.length === 0}>
              <Redo2 className="size-4" /> Redo
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => commit({ start: time, end: effectiveEnd })}
            >
              <Scissors className="size-4" /> Split here
            </Button>
            <Button className="rounded-full" onClick={() => downloadBlob(selected.blob, selected.name)}>
              <Download className="size-4" /> Download clip
            </Button>
          </div>
        </div>

        <aside className="rounded-3xl glass p-4">
          <p className="text-sm font-semibold tracking-tight">Clips</p>
          <ul className="mt-3 flex flex-col gap-2">
            {clips.map((clip) => (
              <li key={clip.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(clip.id)}
                  className={`focus-ring w-full rounded-2xl px-3 py-2.5 text-left text-xs transition-colors ${
                    clip.id === selected.id ? "bg-secondary" : "hover:bg-accent/50"
                  }`}
                >
                  <span className="block truncate font-medium">{clip.name}</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {clip.aspect} · {formatBytes(clip.size)} · score {Math.round(clip.score * 100)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Trash2 className="size-3.5" /> Delete clips from History.
          </p>
        </aside>
      </div>
    </div>
  );
}

function useObjectUrl(blob: Blob | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

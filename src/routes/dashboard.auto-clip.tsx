import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Download,
  FileVideo,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  Youtube,
} from "lucide-react";
import { OptionRow, ScoreBar, StepCard } from "@/features/autoclip/components/ui-bits";
import { useAutoClipStore } from "@/features/autoclip/store";
import { fetchYouTubePreview, parseYouTubeId, readVideoMeta } from "@/features/autoclip/source";
import { parseSubtitles } from "@/features/autoclip/subtitles";
import { isCancellation, runPipeline } from "@/features/autoclip/pipeline";
import { downloadBlob, saveRun } from "@/features/autoclip/useLibrary";
import {
  STAGE_LABEL,
  formatBytes,
  formatDuration,
  type AspectRatio,
  type ExportFormat,
  type Quality,
  type WatermarkPosition,
} from "@/features/autoclip/types";

export const Route = createFileRoute("/dashboard/auto-clip")({
  head: () => ({
    meta: [
      { title: "Auto Clip — AutoClip AI" },
      {
        name: "description",
        content: "Load a video, pick quality, length, count, aspect ratio, captions and watermark, then generate clips locally.",
      },
      { property: "og:title", content: "Auto Clip — AutoClip AI" },
      { property: "og:description", content: "Generate short clips from long videos entirely in your browser." },
    ],
  }),
  component: AutoClipPage,
});

const QUALITIES: Quality[] = ["360p", "480p", "720p", "1080p"];
const LENGTHS = [15, 30, 45, 60];
const COUNTS = [1, 3, 5, 10];
const ASPECTS: AspectRatio[] = ["9:16", "1:1", "16:9"];
const FORMATS: ExportFormat[] = ["mp4", "webm", "gif"];
const POSITIONS: WatermarkPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right", "center"];

function AutoClipPage() {
  const store = useAutoClipStore();
  const {
    source,
    file,
    config,
    stage,
    detail,
    progress,
    clips,
    error,
    cues,
    transcriptName,
  } = store;
  const [url, setUrl] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [customLength, setCustomLength] = useState(String(config.clipLength));
  const [dragging, setDragging] = useState(false);
  const cancelRef = useRef(false);
  const running = stage !== "idle" && stage !== "done" && stage !== "error";

  useEffect(() => () => useAutoClipStore.getState().resetRun(), []);

  const handleFile = useCallback(
    async (incoming: File) => {
      if (!incoming.type.startsWith("video/")) {
        toast.error("That file isn't a video.");
        return;
      }
      try {
        const meta = await readVideoMeta(incoming);
        useAutoClipStore.getState().setSource(
          {
            kind: "file",
            title: incoming.name.replace(/\.[^.]+$/, ""),
            thumbnail: null,
            duration: meta.duration,
            fileName: incoming.name,
            fileSize: incoming.size,
          },
          incoming,
        );
        toast.success(`Loaded ${incoming.name} (${formatDuration(meta.duration)})`);
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "Could not read that video.");
      }
    },
    [],
  );

  const validateUrl = async () => {
    const id = parseYouTubeId(url);
    if (!id) {
      toast.error("That doesn't look like a YouTube link.");
      return;
    }
    setUrlBusy(true);
    try {
      const preview = await fetchYouTubePreview(id);
      useAutoClipStore.getState().setSource(
        {
          kind: "youtube",
          title: preview.title,
          thumbnail: preview.thumbnail,
          duration: 0,
          url: `https://www.youtube.com/watch?v=${id}`,
        },
        null,
      );
      toast.info("Link validated. Add the video file to process it locally.");
    } finally {
      setUrlBusy(false);
    }
  };

  const generate = async () => {
    if (!file || !source) {
      toast.error("Add a video file first — processing happens on your device.");
      return;
    }
    const state = useAutoClipStore.getState();
    state.resetRun();
    cancelRef.current = false;

    try {
      const output = await runPipeline(
        { file, fileName: source.fileName ?? source.title, duration: source.duration, config, cues },
        {
          onStage: (nextStage, nextDetail) => state.setStage(nextStage, nextDetail),
          onProgress: (ratio) => state.setProgress(ratio),
          onLog: (line) => state.pushLog(line),
          onClip: (clip) => useAutoClipStore.getState().addClip(clip),
          onWarning: (message) => toast.warning(message),
          shouldCancel: () => cancelRef.current,
        },
      );
      useAutoClipStore.getState().setHighlights(output.highlights);
      await saveRun(source, config, output.clips);
      toast.success(`${output.clips.length} clip${output.clips.length === 1 ? "" : "s"} ready`);
    } catch (cause) {
      if (isCancellation(cause)) {
        useAutoClipStore.getState().setStage("idle");
        toast.info("Generation cancelled.");
        return;
      }
      const message =
        cause instanceof Error
          ? cause.message
          : typeof cause === "string" && cause.trim()
            ? cause
            : "Processing failed.";
      useAutoClipStore.getState().setStage("error");
      useAutoClipStore.getState().setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Auto Clip</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eight steps. Zero uploads. ffmpeg.wasm does the work in this tab.
          </p>
        </div>
        <Button variant="ghost" className="rounded-full" onClick={() => useAutoClipStore.getState().resetAll()}>
          <RotateCcw className="size-4" /> Reset
        </Button>
      </header>

      <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <StepCard step={1} title="Source" description="Paste a YouTube link for metadata, then drop the video file." complete={Boolean(source)}>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Youtube className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className="rounded-full pl-9"
                  aria-label="YouTube URL"
                />
              </div>
              <Button onClick={validateUrl} disabled={urlBusy} className="rounded-full">
                {urlBusy ? <Loader2 className="size-4 animate-spin" /> : null} Validate
              </Button>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files[0];
                if (dropped) void handleFile(dropped);
              }}
              className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition-colors ${
                dragging ? "border-foreground bg-accent/50" : "border-border hover:bg-accent/30"
              }`}
            >
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(event) => {
                  const picked = event.target.files?.[0];
                  if (picked) void handleFile(picked);
                }}
              />
              <Upload className="size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Drop a video or browse</p>
              <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, WebM, MKV — stays on this device</p>
            </label>

            {source ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                {source.thumbnail ? (
                  <img
                    src={source.thumbnail}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                    width={480}
                    height={360}
                  />
                ) : (
                  <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileVideo className="size-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{source.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {source.kind === "youtube" ? "YouTube metadata" : "Local file"}
                    {source.duration ? ` · ${formatDuration(source.duration)}` : ""}
                    {source.fileSize ? ` · ${formatBytes(source.fileSize)}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  aria-label="Clear source"
                  onClick={() => useAutoClipStore.getState().setSource(null, null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : null}

            {source?.kind === "youtube" && !file ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Browsers can't download YouTube streams and doing so would break YouTube's terms. Drop the video file
                you own to run the full local pipeline.
              </p>
            ) : null}
          </StepCard>

          <StepCard step={2} title="Quality" description="Output height of every clip." complete>
            <OptionRow
              ariaLabel="Quality"
              value={config.quality}
              onChange={(value) => store.patchConfig({ quality: value })}
              options={QUALITIES.map((quality) => ({ value: quality, label: quality }))}
            />
          </StepCard>

          <StepCard step={3} title="Clip length" description="Duration of each generated clip." complete>
            <OptionRow
              ariaLabel="Clip length"
              value={config.clipLength}
              onChange={(value) => store.patchConfig({ clipLength: value })}
              options={LENGTHS.map((length) => ({ value: length, label: `${length}s` }))}
            />
            <div className="mt-3 flex items-center gap-2">
              <Label htmlFor="custom-length" className="text-xs text-muted-foreground">
                Custom
              </Label>
              <Input
                id="custom-length"
                inputMode="numeric"
                value={customLength}
                onChange={(event) => setCustomLength(event.target.value)}
                onBlur={() => {
                  const parsed = Number(customLength);
                  if (Number.isFinite(parsed) && parsed >= 3 && parsed <= 180) {
                    store.patchConfig({ clipLength: Math.round(parsed) });
                  } else {
                    setCustomLength(String(config.clipLength));
                  }
                }}
                className="h-9 w-24 rounded-full"
              />
              <span className="text-xs text-muted-foreground">seconds (3–180)</span>
            </div>
          </StepCard>

          <StepCard step={4} title="Clip count" description="Diversity rules keep moments from repeating." complete>
            <OptionRow
              ariaLabel="Clip count"
              value={config.clipCount}
              onChange={(value) => store.patchConfig({ clipCount: value })}
              options={COUNTS.map((count) => ({ value: count, label: String(count) }))}
            />
          </StepCard>

          <StepCard step={5} title="Aspect ratio" description="Center-safe crop, then scale." complete>
            <OptionRow
              ariaLabel="Aspect ratio"
              value={config.aspect}
              onChange={(value) => store.patchConfig({ aspect: value })}
              options={ASPECTS.map((aspect) => ({ value: aspect, label: aspect }))}
            />
          </StepCard>

          <StepCard step={6} title="Subtitles" description="Import SRT or VTT captions and style the burn-in." complete>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="subs" className="text-sm">
                Burn subtitles
              </Label>
              <Switch
                id="subs"
                checked={config.subtitle.enabled}
                onCheckedChange={(checked) => store.patchSubtitle({ enabled: checked })}
              />
            </div>

            {config.subtitle.enabled ? (
              <div className="mt-4 flex flex-col gap-4">
                <label className="focus-ring flex cursor-pointer items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
                  <span className="truncate">{transcriptName ?? "Upload .srt or .vtt"}</span>
                  <input
                    type="file"
                    accept=".srt,.vtt,text/plain"
                    className="sr-only"
                    onChange={async (event) => {
                      const picked = event.target.files?.[0];
                      if (!picked) return;
                      const parsed = parseSubtitles(await picked.text());
                      if (parsed.length === 0) {
                        toast.error("No cues found in that file.");
                        return;
                      }
                      store.setCues(parsed, picked.name);
                      toast.success(`${parsed.length} cues loaded`);
                    }}
                  />
                  <Badge variant="secondary" className="rounded-full">
                    {cues.length} cues
                  </Badge>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SliderField
                    label={`Font size ${config.subtitle.fontSize}px`}
                    value={config.subtitle.fontSize}
                    min={20}
                    max={80}
                    onChange={(value) => store.patchSubtitle({ fontSize: value })}
                  />
                  <SliderField
                    label={`Stroke ${config.subtitle.stroke}px`}
                    value={config.subtitle.stroke}
                    min={0}
                    max={8}
                    onChange={(value) => store.patchSubtitle({ stroke: value })}
                  />
                </div>

                <OptionRow
                  ariaLabel="Subtitle position"
                  value={config.subtitle.position}
                  onChange={(value) => store.patchSubtitle({ position: value })}
                  options={[
                    { value: "top" as const, label: "Top" },
                    { value: "center" as const, label: "Center" },
                    { value: "bottom" as const, label: "Bottom" },
                  ]}
                />

                <div className="flex flex-wrap gap-4">
                  <ToggleField
                    id="bold"
                    label="Bold"
                    checked={config.subtitle.bold}
                    onChange={(checked) => store.patchSubtitle({ bold: checked })}
                  />
                  <ToggleField
                    id="shadow"
                    label="Shadow"
                    checked={config.subtitle.shadow}
                    onChange={(checked) => store.patchSubtitle({ shadow: checked })}
                  />
                  <ToggleField
                    id="background"
                    label="Background"
                    checked={config.subtitle.background}
                    onChange={(checked) => store.patchSubtitle({ background: checked })}
                  />
                  <ToggleField
                    id="karaoke"
                    label="Word highlight"
                    checked={config.subtitle.highlightWords}
                    onChange={(checked) => store.patchSubtitle({ highlightWords: checked })}
                  />
                </div>
              </div>
            ) : null}
          </StepCard>

          <StepCard step={7} title="Watermark" description="Optional logo burned into every clip." complete>
            <div className="flex flex-col gap-4">
              <label className="focus-ring flex cursor-pointer items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
                <span>{config.watermark.dataUrl ? "Logo attached" : "Upload PNG logo"}</span>
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  className="sr-only"
                  onChange={(event) => {
                    const picked = event.target.files?.[0];
                    if (!picked) return;
                    const reader = new FileReader();
                    reader.onload = () => store.patchWatermark({ dataUrl: String(reader.result) });
                    reader.readAsDataURL(picked);
                  }}
                />
                {config.watermark.dataUrl ? (
                  <img src={config.watermark.dataUrl} alt="" className="h-8 w-auto rounded" />
                ) : (
                  <Upload className="size-4 text-muted-foreground" />
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <SliderField
                  label={`Opacity ${Math.round(config.watermark.opacity * 100)}%`}
                  value={Math.round(config.watermark.opacity * 100)}
                  min={10}
                  max={100}
                  onChange={(value) => store.patchWatermark({ opacity: value / 100 })}
                />
                <SliderField
                  label={`Size ${config.watermark.size}% of width`}
                  value={config.watermark.size}
                  min={5}
                  max={40}
                  onChange={(value) => store.patchWatermark({ size: value })}
                />
              </div>

              <OptionRow
                ariaLabel="Watermark position"
                value={config.watermark.position}
                onChange={(value) => store.patchWatermark({ position: value })}
                options={POSITIONS.map((position) => ({
                  value: position,
                  label: position.replace("-", " "),
                }))}
              />
            </div>
          </StepCard>

          <StepCard step={8} title="Export & generate" description="Format and frame rate for the render." complete>
            <div className="flex flex-col gap-4">
              <OptionRow
                ariaLabel="Format"
                value={config.format}
                onChange={(value) => store.patchConfig({ format: value })}
                options={FORMATS.map((format) => ({ value: format, label: format.toUpperCase() }))}
              />
              <OptionRow
                ariaLabel="Frame rate"
                value={config.fps}
                onChange={(value) => store.patchConfig({ fps: value })}
                options={[
                  { value: 30 as const, label: "30 fps" },
                  { value: 60 as const, label: "60 fps" },
                ]}
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={generate} disabled={running || !file} className="rounded-full" size="lg">
                  {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {running ? "Generating…" : "Generate clips"}
                </Button>
                {running ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    size="lg"
                    onClick={() => {
                      cancelRef.current = true;
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </StepCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl glass p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold tracking-tight">Pipeline</p>
              <Badge variant="secondary" className="rounded-full font-mono text-xs">
                {Math.round(progress * 100)}%
              </Badge>
            </div>
            <Progress value={progress * 100} className="mt-3" />
            <p className="mt-3 text-sm">{STAGE_LABEL[stage]}</p>
            {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            <ul className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
              {(["extract-audio", "analyze-audio", "analyze-motion", "scoring", "cutting", "exporting"] as const).map(
                (key) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${stage === key ? "bg-foreground" : "bg-border"}`} />
                    {STAGE_LABEL[key]}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="rounded-3xl glass p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold tracking-tight">Clips</p>
              {clips.length > 0 ? (
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/dashboard/editor">Open editor</Link>
                </Button>
              ) : null}
            </div>

            {clips.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Generated clips appear here with their highlight breakdown.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {clips.map((clip) => (
                  <li key={clip.id} className="rounded-2xl bg-secondary/40 p-3">
                    {clip.format === "gif" ? (
                      <img src={clip.url} alt={clip.name} className="w-full rounded-xl" loading="lazy" />
                    ) : (
                      <video src={clip.url} controls className="w-full rounded-xl" preload="metadata" />
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {formatDuration(clip.start)} → {formatDuration(clip.end)} · {formatBytes(clip.size)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full"
                        aria-label={`Download ${clip.name}`}
                        onClick={() => downloadBlob(clip.blob, clip.name)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <ScoreBar label="Score" value={clip.score} />
                      <ScoreBar label="Audio" value={clip.parts.audio} />
                      <ScoreBar label="Speech" value={clip.parts.speech} />
                      <ScoreBar label="Motion" value={clip.parts.motion} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <Slider
        className="mt-2"
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(next) => onChange(next[0] ?? value)}
        aria-label={label}
      />
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
    </div>
  );
}

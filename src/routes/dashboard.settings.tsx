import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { applyTheme, readTheme, type ThemeMode } from "@/lib/theme";
import { useAutoClipStore } from "@/features/autoclip/store";
import { db } from "@/lib/db";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AutoClip AI" },
      { name: "description", content: "Theme, performance mode, memory limits, cache and keyboard shortcuts." },
      { property: "og:title", content: "Settings — AutoClip AI" },
      { property: "og:description", content: "Tune performance, storage and appearance for local clip rendering." },
    ],
  }),
  component: SettingsPage,
});

const SHORTCUTS = [
  ["Space", "Play / pause"],
  ["⌘ / Ctrl + K", "Command palette"],
  ["⌘ / Ctrl + S", "Save"],
  ["⌘ / Ctrl + Z", "Undo"],
  ["⌘ / Ctrl + Shift + Z", "Redo"],
];

function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [performanceMode, setPerformanceMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [memoryLimit, setMemoryLimit] = useState(2);
  const config = useAutoClipStore((state) => state.config);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferences stay in local storage on this device.</p>
      </header>

      <section className="mt-8 flex flex-col gap-4">
        <div className="rounded-3xl glass p-5">
          <h2 className="text-sm font-semibold tracking-tight">Appearance</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Label htmlFor="theme">Dark mode</Label>
            <Switch
              id="theme"
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                const next: ThemeMode = checked ? "dark" : "light";
                setTheme(next);
                applyTheme(next);
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl glass p-5">
          <h2 className="text-sm font-semibold tracking-tight">Performance</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="perf">Fast encode preset</Label>
              <p className="mt-1 text-xs text-muted-foreground">Trades a little quality for much faster exports.</p>
            </div>
            <Switch id="perf" checked={performanceMode} onCheckedChange={setPerformanceMode} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="autosave">Auto save projects</Label>
              <p className="mt-1 text-xs text-muted-foreground">Store finished runs in IndexedDB automatically.</p>
            </div>
            <Switch id="autosave" checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
          <div className="mt-5">
            <Label>Memory budget — {memoryLimit} GB</Label>
            <Slider
              className="mt-3"
              value={[memoryLimit]}
              min={1}
              max={8}
              step={1}
              onValueChange={(next) => setMemoryLimit(next[0] ?? memoryLimit)}
              aria-label="Memory budget"
            />
          </div>
        </div>

        <div className="rounded-3xl glass p-5">
          <h2 className="text-sm font-semibold tracking-tight">Data</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "autoclip-settings.json";
                link.click();
              }}
            >
              Export settings
            </Button>
            <Button
              variant="outline"
              className="rounded-full text-destructive"
              onClick={async () => {
                await db().clips.clear();
                await db().projects.clear();
                toast.success("Local cache cleared");
              }}
            >
              Clear cache
            </Button>
          </div>
        </div>

        <div className="rounded-3xl glass p-5">
          <h2 className="text-sm font-semibold tracking-tight">Keyboard shortcuts</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {SHORTCUTS.map(([keys, action]) => (
              <li key={keys} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{action}</span>
                <kbd className="rounded-lg bg-secondary px-2 py-1 font-mono text-xs">{keys}</kbd>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

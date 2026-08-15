import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATES } from "@/features/autoclip/templates";
import { useAutoClipStore } from "@/features/autoclip/store";

export const Route = createFileRoute("/dashboard/templates")({
  head: () => ({
    meta: [
      { title: "Templates — AutoClip AI" },
      { name: "description", content: "Preset clip recipes for gaming, podcast, anime, education, comedy and more." },
      { property: "og:title", content: "Templates — AutoClip AI" },
      { property: "og:description", content: "One-tap presets for length, ratio, captions and quality." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Apply a recipe, then tweak anything in Auto Clip.</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <article key={template.id} className="flex flex-col rounded-3xl glass p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight">{template.name}</h2>
              <Badge variant="secondary" className="rounded-full font-mono text-[10px]">
                {template.config.clipLength}s · {template.config.aspect}
              </Badge>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{template.description}</p>
            <Button
              className="mt-4 rounded-full"
              variant="outline"
              onClick={() => {
                useAutoClipStore.getState().patchConfig(template.config);
                toast.success(`${template.name} preset applied`);
                void router.navigate({ to: "/dashboard/auto-clip" });
              }}
            >
              Use template
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}

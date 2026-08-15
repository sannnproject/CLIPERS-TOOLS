import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  AudioWaveform,
  Captions,
  Cpu,
  Crop,
  Github,
  Layers,
  Lock,
  Scissors,
  Sparkles,
  Zap,
} from "lucide-react";
import heroImage from "@/assets/hero-clips.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoClip AI — Long videos into viral short clips, in your browser" },
      {
        name: "description",
        content:
          "AutoClip AI analyzes audio peaks, silence, motion and captions to cut the best short clips from long videos. 100% local processing with ffmpeg.wasm.",
      },
      { property: "og:title", content: "AutoClip AI — Long videos into viral short clips" },
      {
        property: "og:description",
        content: "Local, private highlight detection and clip export powered by WebAssembly.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: AudioWaveform, title: "Highlight detection", body: "Audio peaks, speech density, silence gaps, motion and caption keywords feed one score." },
  { icon: Scissors, title: "Automatic cutting", body: "Pick 1–10 clips at 15/30/45/60s with diversity rules so moments never repeat." },
  { icon: Crop, title: "Smart reframe", body: "Center-safe crop to 9:16, 1:1 or 16:9 at 360p up to 1080p." },
  { icon: Captions, title: "Caption engine", body: "Import SRT or VTT, style font, stroke, shadow and karaoke word highlighting." },
  { icon: Layers, title: "Watermarks", body: "Drop a logo, set opacity, size and corner. Burned in on export." },
  { icon: Lock, title: "Zero uploads", body: "Video never leaves your device. No tracking, no analytics, no server rendering." },
];

const STEPS = [
  { title: "Load a video", body: "Drag in a file or paste a YouTube link to preview its title, thumbnail and duration." },
  { title: "Configure", body: "Quality, clip length, count, aspect ratio, captions and watermark in eight quick steps." },
  { title: "Analyze locally", body: "ffmpeg.wasm extracts audio while Web Audio and canvas sampling score every window." },
  { title: "Export", body: "MP4, WebM or GIF at 30 or 60fps, saved to your device and IndexedDB history." },
];

const FAQ = [
  { q: "Is my video uploaded anywhere?", a: "No. Decoding, analysis and encoding all run inside your browser tab using WebAssembly and Web Workers. Nothing is sent to a server." },
  { q: "Can it download YouTube videos for me?", a: "No — browsers cannot fetch YouTube streams directly, and doing so would break YouTube's terms. Paste a link to pull the title, duration and thumbnail, then drop in your own file to process." },
  { q: "Which browsers work best?", a: "Chrome and Edge are fastest. Firefox and Safari work with slightly slower encoding. Everything degrades gracefully when WebCodecs is unavailable." },
  { q: "How long can the source video be?", a: "Browser memory is the limit. Videos under ~20 minutes and 500MB feel comfortable on most machines; use 360p or 480p output for longer sources." },
  { q: "Do I need an account?", a: "No accounts, no cookies beyond your local preferences. Projects, clips and templates live in IndexedDB on your machine." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-strong">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 focus-ring rounded-full">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">AutoClip AI</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#features">Features</a>
            <a className="transition-colors hover:text-foreground" href="#demo">Demo</a>
            <a className="transition-colors hover:text-foreground" href="#how">How it works</a>
            <a className="transition-colors hover:text-foreground" href="#faq">FAQ</a>
            <Link className="transition-colors hover:text-foreground" to="/about">About</Link>
          </nav>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/dashboard">
              Open app <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 text-center md:pt-28">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              <Cpu className="mr-1 size-3" /> Runs 100% in your browser
            </Badge>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
              <span className="text-gradient">Long videos in. Viral short clips out.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
              AutoClip AI scores every second of your footage for energy, speech, silence and motion, then cuts,
              reframes and captions the best moments — without uploading a single byte.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
                <Link to="/dashboard/auto-clip">
                  Start clipping free <Zap className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
                <a href="#demo">See the pipeline</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No account. No uploads. No watermark on your exports.</p>

            <div className="relative mx-auto mt-14 max-w-4xl">
              <div className="overflow-hidden rounded-3xl glass p-2 shadow-glow">
                <img
                  src={heroImage}
                  alt="AutoClip AI timeline with detected highlight peaks and three vertical clip previews"
                  className="w-full rounded-2xl"
                  width={1600}
                  height={1000}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
          <SectionHeading kicker="Features" title="Everything the edit needs, nothing it doesn't" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-3xl glass p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 border-y border-border bg-card/40 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading kicker="Demo" title="The pipeline, stage by stage" />
            <ol className="mt-10 grid gap-2 md:grid-cols-3">
              {[
                "Read source",
                "Load ffmpeg.wasm",
                "Extract audio",
                "Analyze volume",
                "Detect peaks",
                "Measure silence",
                "Sample motion",
                "Score windows",
                "Pick best segments",
                "Cut clips",
                "Burn captions",
                "Crop + export",
              ].map((stage, index) => (
                <li key={stage} className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{stage}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
          <SectionHeading kicker="How it works" title="Four moves from raw footage to shorts" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <article key={step.title} className="rounded-3xl glass p-6">
                <span className="font-mono text-xs text-muted-foreground">Step {index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-20">
          <div className="rounded-4xl glass p-8 text-center">
            <Badge variant="outline" className="rounded-full">Pricing — coming soon</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Free while in preview</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Local processing means no render servers to pay for. Paid tiers will only add cloud sync and team
              workspaces later.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/dashboard">Use it now</Link>
            </Button>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-24">
          <SectionHeading kicker="FAQ" title="Questions, answered" />
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-border">
                <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} AutoClip AI — processed locally, always.</p>
            <p className="mt-1 text-xs">
              Developed by <span className="font-medium text-foreground">SANN404 FORUM GROUP</span>
            </p>
          </div>

          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link className="transition-colors hover:text-foreground" to="/about">About</Link>
            <Link className="transition-colors hover:text-foreground" to="/dashboard/settings">Settings</Link>
            <a className="flex items-center gap-1 transition-colors hover:text-foreground" href="#features">
              <Github className="size-4" /> Open source soon
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{kicker}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
    </div>
  );
}

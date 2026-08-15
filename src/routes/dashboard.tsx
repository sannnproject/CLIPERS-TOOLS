import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Clapperboard,
  History,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import { applyTheme, readTheme, type ThemeMode } from "@/lib/theme";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/auto-clip", label: "Auto Clip", icon: Wand2 },
  { to: "/dashboard/editor", label: "Editor", icon: Clapperboard },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/templates", label: "Templates", icon: SlidersHorizontal },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
] as const;

function DashboardLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const router = useRouter();

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-[110rem] overflow-x-hidden">

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border p-4 lg:flex">
          <SidebarContent onNavigate={() => undefined} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 glass-strong">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Open navigation">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="focus-ring flex h-9 flex-1 items-center gap-2 rounded-full glass px-4 text-left text-sm text-muted-foreground transition-colors hover:text-foreground sm:max-w-sm"
              >
                <Search className="size-4" />
                <span className="truncate">Search or jump to…</span>
                <kbd className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:block">⌘K</kbd>
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/dashboard/auto-clip">New clip</Link>
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="overflow-hidden rounded-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Command palette</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                {NAV.map((item) => (
                  <CommandItem
                    key={item.to}
                    value={item.label}
                    onSelect={() => {
                      setPaletteOpen(false);
                      void router.navigate({ to: item.to });
                    }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="focus-ring mb-6 flex items-center gap-2 rounded-full px-2" onClick={onNavigate}>
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">AutoClip AI</span>
      </Link>

      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: "exact" in item && item.exact === true }}
            onClick={onNavigate}
            className="focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-3xl glass p-4">
          <p className="text-xs font-medium">Local-first</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Video decoding and export happen on this device. Nothing is uploaded.
          </p>
        </div>
        <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">
          Developed by <span className="font-medium text-foreground">SANN404 FORUM GROUP</span>
        </p>
      </div>

    </div>
  );
}

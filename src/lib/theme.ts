const STORAGE_KEY = "autoclip.theme";

export type ThemeMode = "dark" | "light";

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function syncTheme(): void {
  applyTheme(readTheme());
}

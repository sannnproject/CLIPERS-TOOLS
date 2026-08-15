import type { FFmpeg } from "@ffmpeg/ffmpeg";

// The bundled worker is a module worker, so it can only `import()` the core.
// That means the ESM build of ffmpeg-core is required — the UMD build fails
// with "failed to import ffmpeg-core.js".
const CORE_BASES = [
  "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm",
];

let enginePromise: Promise<FFmpeg> | null = null;

export type LogHandler = (message: string) => void;

/**
 * Lazily loads ffmpeg.wasm in the browser. The engine runs entirely client side —
 * no video bytes ever leave the device.
 */
export async function getEngine(onLog?: LogHandler): Promise<FFmpeg> {
  if (typeof window === "undefined") {
    throw new Error("ffmpeg.wasm can only run in the browser");
  }
  if (!enginePromise) {
    enginePromise = (async () => {
      const [{ FFmpeg: FFmpegClass }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const engine = new FFmpegClass();
      let lastError: unknown = null;
      for (const base of CORE_BASES) {
        try {
          await engine.load({
            coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
          });
          return engine;
        } catch (error) {
          lastError = error;
        }
      }
      throw new Error(
        `Could not start the video engine. ${lastError instanceof Error ? lastError.message : String(lastError ?? "")}`.trim(),
      );
    })().catch((error: unknown) => {
      enginePromise = null;
      throw error;
    });
  }
  const engine = await enginePromise;
  if (onLog) {
    engine.on("log", ({ message }) => onLog(message));
  }
  return engine;
}

export function isEngineLoaded(): boolean {
  return enginePromise !== null;
}

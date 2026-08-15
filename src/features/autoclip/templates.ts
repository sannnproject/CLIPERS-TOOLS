import { DEFAULT_CONFIG, type ClipConfig } from "./types";

export interface ClipTemplate {
  id: string;
  name: string;
  description: string;
  config: ClipConfig;
}

function template(
  id: string,
  name: string,
  description: string,
  overrides: Omit<Partial<ClipConfig>, "subtitle"> & { subtitle?: Partial<ClipConfig["subtitle"]> },
): ClipTemplate {
  const { subtitle, ...rest } = overrides;
  return {
    id,
    name,
    description,
    config: {
      ...DEFAULT_CONFIG,
      ...rest,
      subtitle: { ...DEFAULT_CONFIG.subtitle, ...subtitle },
    },
  };
}

export const TEMPLATES: ClipTemplate[] = [
  template("gaming", "Gaming", "Fast peaks, punchy 15s verticals with karaoke captions.", {
    clipLength: 15,
    clipCount: 5,
    aspect: "9:16",
    fps: 60,
    subtitle: { enabled: true, fontSize: 46, highlightWords: true },
  }),
  template("podcast", "Podcast", "Speech-dense 45s cuts, bottom captions with background.", {
    clipLength: 45,
    clipCount: 3,
    subtitle: { enabled: true, background: true, fontSize: 38 },
  }),
  template("movie", "Movie", "Cinematic 30s scenes in 16:9 at 1080p.", {
    clipLength: 30,
    aspect: "16:9",
    quality: "1080p",
  }),
  template("anime", "Anime", "High-motion 15s verticals with heavy stroke captions.", {
    clipLength: 15,
    clipCount: 5,
    subtitle: { enabled: true, stroke: 5 },
  }),
  template("reaction", "Reaction", "Square 30s cuts for feeds.", { aspect: "1:1", clipLength: 30 }),
  template("education", "Education", "60s explainer clips with centered captions.", {
    clipLength: 60,
    subtitle: { enabled: true, position: "center" },
  }),
  template("tutorial", "Tutorial", "45s steps at 1080p with top captions.", {
    clipLength: 45,
    quality: "1080p",
    subtitle: { enabled: true, position: "top" },
  }),
  template("music", "Music", "Beat-driven 30s clips, 60fps, no captions.", { fps: 60, clipLength: 30 }),
  template("motivation", "Motivation", "Bold 15s verticals with big karaoke text.", {
    clipLength: 15,
    clipCount: 10,
    subtitle: { enabled: true, fontSize: 54, bold: true },
  }),
  template("news", "News", "Clean 30s cuts with subtitle background.", {
    subtitle: { enabled: true, background: true },
  }),
  template("tech", "Tech", "Crisp 45s 1080p verticals.", { clipLength: 45, quality: "1080p" }),
  template("comedy", "Comedy", "Punchline-hunting 15s clips, 10 per video.", {
    clipLength: 15,
    clipCount: 10,
    subtitle: { enabled: true, highlightWords: true },
  }),
];

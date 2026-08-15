export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

export function readVideoMeta(file: Blob): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const meta = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be decoded by your browser."));
    };
    video.src = url;
  });
}

const YOUTUBE_PATTERN =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

export function parseYouTubeId(url: string): string | null {
  const match = YOUTUBE_PATTERN.exec(url.trim());
  return match?.[1] ?? null;
}

export interface YouTubePreview {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
}

/** Public oEmbed lookup — metadata only, no video bytes. */
export async function fetchYouTubePreview(id: string): Promise<YouTubePreview> {
  const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
    );
    if (!response.ok) throw new Error("oEmbed failed");
    const data = (await response.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      id,
      title: data.title ?? "YouTube video",
      author: data.author_name ?? "Unknown channel",
      thumbnail: data.thumbnail_url ?? thumbnail,
    };
  } catch {
    return { id, title: "YouTube video", author: "Unknown channel", thumbnail };
  }
}

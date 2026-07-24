export function parseYouTubeVideoId(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      if (pathMatch) return pathMatch[1];
    }
  } catch {
    const match = value.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return match?.[1] ?? null;
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function isValidYouTubeUrl(url: string) {
  return parseYouTubeVideoId(url) !== null;
}

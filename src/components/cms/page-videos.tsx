import { getLocalizedText } from "@/lib/utils";
import type { QualityPageVideo } from "@/lib/quality/page-metadata";
import { getYouTubeEmbedUrl, parseYouTubeVideoId } from "@/lib/youtube/parse-url";

type PageVideosProps = {
  videos: QualityPageVideo[];
  locale: string;
  title?: string;
};

export function PageVideos({ videos, locale, title = "Videolar" }: PageVideosProps) {
  const sorted = [...videos]
    .map((video) => ({
      ...video,
      videoId: parseYouTubeVideoId(video.youtubeUrl),
    }))
    .filter((video) => video.videoId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold text-brand-brown-dark">{title}</h2>
      <div className="grid gap-8">
        {sorted.map((video) => {
          const videoTitle = getLocalizedText(video.title, locale);
          const embedUrl = getYouTubeEmbedUrl(video.videoId!);

          return (
            <article key={video.id} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="relative aspect-video bg-black">
                <iframe
                  src={embedUrl}
                  title={videoTitle || "YouTube video"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              {videoTitle && (
                <p className="border-t border-border p-4 text-sm font-medium text-brand-brown-dark">
                  {videoTitle}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

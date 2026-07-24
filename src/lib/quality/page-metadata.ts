export type QualityPageDocument = {
  id: string;
  title: Record<string, string>;
  coverImage?: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

export type QualityPageVideo = {
  id: string;
  title: Record<string, string>;
  youtubeUrl: string;
  sortOrder: number;
};

export type QualityPageMetadata = {
  documents?: QualityPageDocument[];
  videos?: QualityPageVideo[];
};

export const qualityPageConfigs = [
  { slug: "arge-kalite-yonetimi", label: "Kalite Yönetimi", sortOrder: 0 },
  { slug: "arge-belgelendirme", label: "Belgelendirme", sortOrder: 1 },
  { slug: "arge-omur-testleri", label: "Ömür Testleri", sortOrder: 2 },
] as const;

export const qualityPageSlugs: string[] = qualityPageConfigs.map((page) => page.slug);

export type QualityPageSlug = (typeof qualityPageConfigs)[number]["slug"];

export function parseQualityMetadata(metadata: unknown): QualityPageMetadata {
  if (!metadata || typeof metadata !== "object") return { documents: [], videos: [] };
  const data = metadata as QualityPageMetadata;
  return {
    documents: Array.isArray(data.documents) ? data.documents : [],
    videos: Array.isArray(data.videos) ? data.videos : [],
  };
}

export function qualityRouteSlug(pageSlug: string) {
  return pageSlug.replace(/^arge-/, "");
}

export function getQualityPageSortOrder(slug: string) {
  return qualityPageConfigs.find((page) => page.slug === slug)?.sortOrder ?? 0;
}

export function isLifeTestsPage(slug: string) {
  return slug === "arge-omur-testleri";
}

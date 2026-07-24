import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";
import { CmsPageContent } from "@/components/cms/page-content";
import { parseQualityMetadata } from "@/lib/quality/page-metadata";

const rdSlugs = ["arge-surecleri", "muhendislik", "kalite-kontrol", "kalite-yonetimi", "belgelendirme", "omur-testleri"];

export function generateStaticParams() {
  return rdSlugs.map((slug) => ({ slug }));
}

export default async function RDPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = await db.page.findUnique({
    where: { slug: `arge-${slug}`, isActive: true },
  });

  if (!page) notFound();

  const title = getLocalizedText(page.title as { tr: string }, locale);
  const content = getLocalizedText(page.content as { tr: string }, locale);
  const { documents, videos } = parseQualityMetadata(page.metadata);

  return (
    <CmsPageContent
      title={title}
      content={content}
      heroImage={page.heroImage}
      images={page.images}
      documents={documents}
      videos={videos}
      locale={locale}
    />
  );
}

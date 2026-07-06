import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";
import { CmsPageContent } from "@/components/cms/page-content";

const productionSlugs = [
  "kaynak",
  "kaliphane",
  "cnc",
  "vulkanizasyon",
  "sac-sekillendirme",
  "aluminyum-enjeksiyon",
  "plastik-enjeksiyon",
  "montaj",
  "markalama",
];

export function generateStaticParams() {
  return productionSlugs.map((slug) => ({ slug }));
}

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = await db.page.findUnique({
    where: { slug: `uretim-${slug}`, isActive: true },
  });

  if (!page) notFound();

  const title = getLocalizedText(page.title as { tr: string }, locale);
  const content = getLocalizedText(page.content as { tr: string }, locale);

  return (
    <CmsPageContent
      title={title}
      content={content}
      heroImage={page.heroImage}
      images={page.images}
    />
  );
}

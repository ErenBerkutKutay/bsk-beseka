import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";

const rdSlugs = ["arge-surecleri", "muhendislik", "kalite-kontrol"];

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">
        {getLocalizedText(page.title as { tr: string }, locale)}
      </h1>
      <div
        className="prose-content mt-8"
        dangerouslySetInnerHTML={{
          __html: getLocalizedText(page.content as { tr: string }, locale).replace(
            /\n/g,
            "<br/>",
          ),
        }}
      />
    </div>
  );
}

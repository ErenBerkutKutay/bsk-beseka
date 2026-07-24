import Image from "next/image";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";

export default async function DownloadCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("media");

  const assets = await db.downloadAsset.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="mb-3 text-3xl font-bold text-brand-brown-dark">{t("downloadPageTitle")}</h1>
      <p className="mb-10 max-w-2xl text-muted">{t("downloadPageDesc")}</p>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center text-muted">
          {t("downloadEmpty")}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const title = getLocalizedText(asset.title as { tr: string }, locale);
            return (
              <a
                key={asset.id}
                href={asset.fileUrl}
                download={asset.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:border-brand-brown hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-brand-cream-light">
                  {asset.coverImage ? (
                    <Image src={asset.coverImage} alt={title} fill className="object-cover" sizes="320px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Download className="h-10 w-10 text-brand-brown/40" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-bold text-brand-brown-dark group-hover:text-brand-brown">{title}</h2>
                    <p className="mt-1 text-xs text-muted">{asset.fileName}</p>
                  </div>
                  <Download className="h-5 w-5 shrink-0 text-brand-brown" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-sm text-muted">
        {t("downloadHint")}{" "}
        <Link href={`/${locale}/medya/haberler`} className="text-brand-brown hover:underline">
          {t("newsPageTitle")}
        </Link>
      </p>
    </div>
  );
}

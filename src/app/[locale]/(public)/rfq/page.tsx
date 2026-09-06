import { setRequestLocale } from "next-intl/server";
import { RFQCrossMatchClient } from "@/components/rfq/rfq-cross-match-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";

  return {
    title: isTr
      ? "Toplu RFQ & OEM Çapraz Referans Eşleştirme | Beseka Otomotiv"
      : "Bulk RFQ & OEM Cross-Reference Matching | Beseka Automotive",
    description: isTr
      ? "Excel listenizi yükleyin; OEM numaralarını Beseka ürün kataloğuyla anında çaprazlayıp eşleşen parçaları ve teklif listenizi indirin."
      : "Upload your parts list in Excel, cross-match OEM numbers with Beseka automotive catalog, and export matched quotation lists.",
  };
}

export default async function RFQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RFQCrossMatchClient locale={locale} />;
}

import { routing } from "@/i18n/routing";

import type { Metadata } from "next";
import { besekaAssets } from "@/lib/beseka/assets";

export const metadata: Metadata = {
  title: {
    default: "Beseka Otomotiv",
    template: "%s | Beseka Otomotiv",
  },
  description: "Otomotiv yedek parça üreticisi — katalog, OEM arama ve B2B platformu",
  icons: {
    icon: besekaAssets.favicon,
    shortcut: besekaAssets.favicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

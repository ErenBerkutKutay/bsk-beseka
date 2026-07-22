import { besekaAssets } from "@/lib/beseka/assets";

export type HomeIntroContent = {
  eyebrow: Record<string, string>;
  title: Record<string, string>;
  body: Record<string, string>;
  subtitle: Record<string, string>;
  image: string;
  primaryLabel: Record<string, string>;
  primaryHref: string;
  secondaryLabel: Record<string, string>;
  secondaryHref: string;
  isActive: boolean;
};

export const fallbackHomeIntro: HomeIntroContent = {
  eyebrow: { tr: "Beseka Otomotiv" },
  title: { tr: "Güçlü, Genç ve Yenilikçi Ekip" },
  body: {
    tr: "Beseka Otomotiv, yedek parça sektörünün önde gelen üreticilerinden biridir. Aynı üretim tesisinde motor takozu, amortisör takozu, körük ve salıncak burçları ile dünya genelindeki müşterilerine hizmet sunmaktadır.",
  },
  subtitle: {
    tr: "Motor takozu ve otomotiv yedek parçada 35 yılı aşkın mühendislik deneyimi. Kauçuk-metal birleşim teknolojisiyle maksimum uyum ve performans.",
  },
  image: besekaAssets.hero[0],
  primaryLabel: { tr: "Hakkımızda" },
  primaryHref: "/kurumsal/hakkimizda",
  secondaryLabel: { tr: "Online Katalog" },
  secondaryHref: "/urunler",
  isActive: true,
};

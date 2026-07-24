export type HomeContactContent = {
  eyebrow: Record<string, string>;
  title: Record<string, string>;
  companyName: Record<string, string>;
  address: Record<string, string>;
  phone: string;
  email: string;
  image: string;
  buttonLabel: Record<string, string>;
  buttonHref: string;
  textPanelEnabled: boolean;
  textPanelColor: string;
  textPanelOpacity: number;
  isActive: boolean;
};

export const fallbackHomeContact: HomeContactContent = {
  eyebrow: { tr: "Beseka" },
  title: { tr: "İletişim" },
  companyName: { tr: "Beseka Otomotiv San. ve Tic. Ltd. Şti." },
  address: { tr: "Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri" },
  phone: "+90 (224) 482 44 55",
  email: "info@beseka.com",
  image: "/beseka/home-contact-facility.png",
  buttonLabel: { tr: "Tüm İletişim Bilgileri" },
  buttonHref: "/iletisim/bilgiler",
  textPanelEnabled: true,
  textPanelColor: "#3d2b1f",
  textPanelOpacity: 75,
  isActive: true,
};

export function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(61, 43, 31, ${opacity / 100})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

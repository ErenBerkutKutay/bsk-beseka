export type HomeStatItem = {
  id: string;
  value: string;
  label: string;
  sub: string;
};

export const fallbackHomeStats: HomeStatItem[] = [
  { id: "fallback-1", value: "40+", label: "Ülke", sub: "5 Kıtada Hizmet" },
  { id: "fallback-2", value: "5.000+", label: "Ref", sub: "En Yüksek Kalite" },
  { id: "fallback-3", value: "100+", label: "Çalışan", sub: "Yüksek Nitelikli" },
  { id: "fallback-4", value: "35+", label: "Yıl", sub: "Üretim Deneyimi" },
];

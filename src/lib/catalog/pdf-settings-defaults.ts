import { besekaAssets } from "@/lib/beseka/assets";

export type CatalogPdfSettingsData = {
  id: string;
  logoUrl: string;
  headerBackgroundUrl: string | null;
  headerBackgroundColor: string;
  headerHeightMm: number;
  documentTitle: string;
  tableHeaderColor: string;
  isActive: boolean;
};

export const defaultCatalogPdfSettings = {
  logoUrl: besekaAssets.logo,
  headerBackgroundUrl: null as string | null,
  headerBackgroundColor: "#c8102e",
  headerHeightMm: 32,
  documentTitle: "Beseka Ürün Kataloğu",
  tableHeaderColor: "#3d3d3d",
  isActive: true,
};

export function parseHexColor(hex: string): [number, number, number] {
  const value = hex.replace("#", "").trim();
  if (value.length !== 6) return [61, 61, 61];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export const CATALOG_RESULTS_ID = "catalog-sonuclar";

export function buildCatalogSearchUrl(
  locale: string,
  params: Record<string, string | undefined> | URLSearchParams,
) {
  const searchParams =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params).filter(([, value]) => value) as [string, string][],
        );

  searchParams.delete("scroll");

  const query = searchParams.toString();
  return `/${locale}/urunler${query ? `?${query}` : ""}#${CATALOG_RESULTS_ID}`;
}

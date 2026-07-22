export const CATALOG_RESULTS_ID = "catalog-sonuclar";

export function hasActiveCatalogSearch(
  params: Record<string, string | undefined> | URLSearchParams,
): boolean {
  const get = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  return !!(
    get("q") ||
    get("sku") ||
    get("make") ||
    get("model") ||
    get("engineInfo") ||
    get("subModel") ||
    get("vehicleId") ||
    get("category") ||
    get("catalog") === "1"
  );
}

export function isCatalogResultsPath(pathname: string): boolean {
  return /\/urunler\/?$/.test(pathname);
}

export function shouldShowCatalogSideTab(pathname: string, searchParams: URLSearchParams): boolean {
  if (!isCatalogResultsPath(pathname)) return true;
  return !hasActiveCatalogSearch(searchParams);
}

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

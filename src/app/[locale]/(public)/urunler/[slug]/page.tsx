import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/lib/products/search";
import { trackProductView } from "@/lib/analytics";
import { formatYearRange } from "@/lib/catalog/fitment-display";
import { Badge } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [product, t] = await Promise.all([
    getProductBySlug(slug),
    getTranslations({ locale, namespace: "product" }),
  ]);

  if (!product) notFound();

  void trackProductView(product.id);

  const name = getLocalizedText(product.name as { tr: string }, locale);
  const description = product.description
    ? getLocalizedText(product.description as { tr: string }, locale)
    : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="product-image-frame relative aspect-square overflow-hidden rounded-2xl shadow-md">
          {product.images[0] ? (
            <Image src={product.images[0]} alt={name} fill className="product-image" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              Görsel yok
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-brown px-3 py-1 text-sm font-bold text-brand-cream">
              {product.sku}
            </span>
            {product.isNew && <Badge variant="new">Yeni</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-brand-brown-dark">{name}</h1>
          {description && <p className="mt-4 leading-relaxed text-muted">{description}</p>}

          {(product.weightKg != null || product.gtip) && (
            <dl className="mt-6 grid gap-4 rounded-xl border border-border bg-brand-cream-light/40 p-4 text-sm sm:grid-cols-2">
              {product.weightKg != null && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("weight")}
                  </dt>
                  <dd className="mt-1 font-medium text-brand-brown-dark">
                    {Number(product.weightKg).toLocaleString(locale, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}{" "}
                    kg
                  </dd>
                </div>
              )}
              {product.gtip && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">GTIP</dt>
                  <dd className="mt-1 font-mono font-medium text-brand-brown-dark">{product.gtip}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-8">
            <h2 className="font-bold text-brand-brown-dark">{t("oemCodes")}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.oemCodes.map((code) => (
                <span
                  key={code.id}
                  className="rounded-md bg-brand-cream-light px-3 py-1 font-mono text-sm text-brand-brown-dark ring-1 ring-brand-cream"
                >
                  {code.code}
                </span>
              ))}
            </div>
          </div>

          {product.crossCodes.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-brand-brown-dark">{t("crossCodes")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.crossCodes.map((code) => (
                  <span
                    key={code.id}
                    className="rounded-md bg-brand-cream-light px-3 py-1 font-mono text-sm text-brand-brown-dark ring-1 ring-brand-cream"
                  >
                    {code.code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.vehicleTypes.some((link) => link.vehicleType.tipNo > 0) && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-brand-brown-dark">{t("compatibleVehicles")}</h2>
          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-brown text-brand-cream">
                <tr>
                  <th className="px-4 py-3 text-left">{t("vehicleId")}</th>
                  <th className="px-4 py-3 text-left">{t("make")}</th>
                  <th className="px-4 py-3 text-left">{t("model")}</th>
                  <th className="px-4 py-3 text-left">{t("engineInfo")}</th>
                  <th className="px-4 py-3 text-left">{t("year")}</th>
                  <th className="px-4 py-3 text-left">{t("engineVolumeL")}</th>
                  <th className="px-4 py-3 text-left">{t("engineVolumeCcm")}</th>
                  <th className="px-4 py-3 text-left">{t("fuelType")}</th>
                  <th className="px-4 py-3 text-left">{t("power")}</th>
                  <th className="px-4 py-3 text-left">{t("engineCodes")}</th>
                </tr>
              </thead>
              <tbody>
                {product.vehicleTypes
                  .filter((link) => link.vehicleType.tipNo > 0)
                  .map((link) => {
                  const vt = link.vehicleType;
                  const power = [vt.kw ? `${vt.kw} kW` : null, vt.hp ? `${vt.hp} HP` : null]
                    .filter(Boolean)
                    .join(" / ");

                  return (
                    <tr
                      key={link.id}
                      className="border-t border-border even:bg-brand-cream-light/50"
                    >
                      <td className="px-4 py-3 font-mono">{vt.tipNo}</td>
                      <td className="px-4 py-3">{vt.make}</td>
                      <td className="px-4 py-3">{vt.modelSeries}</td>
                      <td className="px-4 py-3">{vt.typeName}</td>
                      <td className="px-4 py-3">
                        {formatYearRange(vt.yearFrom, vt.yearTo)}
                      </td>
                      <td className="px-4 py-3">
                        {vt.engineVolumeL != null ? Number(vt.engineVolumeL) : "—"}
                      </td>
                      <td className="px-4 py-3">{vt.engineVolumeCcm ?? "—"}</td>
                      <td className="px-4 py-3">{vt.fuelType || "—"}</td>
                      <td className="px-4 py-3">{power || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{vt.engineCodes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

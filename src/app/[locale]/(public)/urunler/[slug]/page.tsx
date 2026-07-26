import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/lib/products/search";
import { trackProductView } from "@/lib/analytics";
import {
  buildProductVehicleDetailRows,
  formatYearRange,
} from "@/lib/catalog/fitment-display";
import { Badge } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";

function InfoBlock({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 font-medium text-brand-brown-dark ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

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
  const vehicleRows = buildProductVehicleDetailRows(product);
  const packageQuantity = product.packageQuantity ?? 1;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 py-10 md:px-5 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-brand-brown px-3 py-1 text-sm font-bold text-brand-cream">
          {product.sku}
        </span>
        {product.isNew && <Badge variant="new">Yeni</Badge>}
      </div>
      <h1 className="mt-3 text-3xl font-bold text-brand-brown-dark">{name}</h1>
      {description && <p className="mt-4 max-w-4xl leading-relaxed text-muted">{description}</p>}

      <div className="mt-8 grid w-full grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.25fr)_auto] lg:items-start lg:gap-x-4 xl:gap-x-8">
        <div className="product-image-frame relative aspect-square w-[180px] shrink-0 overflow-hidden rounded-2xl bg-brand-cream-light/30 shadow-md sm:w-[220px] lg:w-[240px] lg:justify-self-start">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={name}
              fill
              className="product-image object-contain p-8 sm:p-10 md:p-12"
              sizes="260px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Görsel yok</div>
          )}
        </div>

        <section className="min-w-0 rounded-xl border border-border bg-brand-cream-light/40 p-4 lg:max-w-sm">
          <h2 className="text-sm font-bold text-brand-brown-dark">{t("productInfo")}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {product.weightKg != null && (
              <InfoBlock
                label={t("weight")}
                value={`${Number(product.weightKg).toLocaleString(locale, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })} kg`}
              />
            )}
            {product.gtip && <InfoBlock label="GTIP" value={product.gtip} mono />}
            <InfoBlock label={t("packageQuantity")} value={String(packageQuantity)} />
          </dl>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-white p-4">
          <h2 className="text-sm font-bold text-brand-brown-dark">{t("vehicleInfo")}</h2>
          {vehicleRows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 pr-3 font-semibold">{t("make")}</th>
                    <th className="pb-2 pr-3 font-semibold">{t("model")}</th>
                    <th className="pb-2 font-semibold">{t("year")}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRows.map((row) => (
                    <tr key={row.key} className="border-b border-border/70 last:border-0">
                      <td className="py-2 pr-3 align-top">{row.make}</td>
                      <td className="py-2 pr-3 align-top">{row.model}</td>
                      <td className="py-2 align-top">{row.yearLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">—</p>
          )}
        </section>

        <section className="w-full shrink-0 rounded-xl border border-border bg-white p-4 sm:w-auto sm:min-w-[180px] lg:justify-self-end">
          <h2 className="text-sm font-bold text-brand-brown-dark">{t("oemCodes")}</h2>
          {product.oemCodes.length ? (
            <ul className="mt-4 space-y-2">
              {product.oemCodes.map((code) => (
                <li
                  key={code.id}
                  className="border-b border-border/70 py-2 font-mono text-sm text-brand-brown-dark last:border-0"
                >
                  {code.code}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">—</p>
          )}
        </section>
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
                        <td className="px-4 py-3">{formatYearRange(vt.yearFrom, vt.yearTo)}</td>
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

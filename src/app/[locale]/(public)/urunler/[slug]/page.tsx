import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/lib/products/search";
import { trackProductView } from "@/lib/analytics";
import { Badge } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
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
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Ağırlık</dt>
                  <dd className="mt-1 font-medium text-brand-brown-dark">
                    {Number(product.weightKg).toLocaleString("tr-TR", {
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
            <h2 className="font-bold text-brand-brown-dark">OEM Kodları</h2>
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
              <h2 className="font-bold text-brand-brown-dark">Cross Kodları</h2>
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

      {product.fitments.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-brand-brown-dark">Uyumlu Araçlar</h2>
          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-brand-brown text-brand-cream">
                <tr>
                  <th className="px-4 py-3 text-left">Marka</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Alt Model</th>
                  <th className="px-4 py-3 text-left">Yıl</th>
                  <th className="px-4 py-3 text-left">Motor</th>
                </tr>
              </thead>
              <tbody>
                {product.fitments.map((fitment) => (
                  <tr key={fitment.id} className="border-t border-border even:bg-brand-cream-light/50">
                    <td className="px-4 py-3">{fitment.make}</td>
                    <td className="px-4 py-3">{fitment.model}</td>
                    <td className="px-4 py-3">{fitment.subModel || "-"}</td>
                    <td className="px-4 py-3">
                      {fitment.yearFrom || fitment.yearTo
                        ? `${fitment.yearFrom || "?"} - ${fitment.yearTo || "?"}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{fitment.engine || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

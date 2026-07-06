import { setRequestLocale } from "next-intl/server";
import { searchProducts } from "@/lib/products/search";
import { NewProductsGrid } from "@/components/catalog/product-grid";

export default async function NewProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { products, total } = await searchProducts({ isNew: true, limit: 50 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Yeni Ürünler</h1>
      <p className="mb-8 text-zinc-500">{total} yeni ürün</p>
      <NewProductsGrid products={products as never[]} locale={locale} />
    </div>
  );
}

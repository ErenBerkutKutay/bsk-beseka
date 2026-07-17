import Image from "next/image";
import Link from "next/link";
import { besekaAssets } from "@/lib/beseka/assets";
import { PRODUCT_GROUPS } from "@/lib/categories/product-groups";
import { resolveCategoryImage } from "@/lib/categories/display-image";

type CategoryItem = {
  slug: string;
  name: string;
  image: string;
};

const defaultCategories: CategoryItem[] = PRODUCT_GROUPS.map((group, index) => ({
  slug: group.slug,
  name: group.name.tr,
  image:
    resolveCategoryImage({ slug: group.slug, index }) ||
    besekaAssets.products.B8376,
}));

export function HeroCategories({
  locale,
  categories,
}: {
  locale: string;
  categories?: CategoryItem[];
}) {
  const items = categories?.length ? categories : defaultCategories;

  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <h2 className="mb-4 text-center text-base font-black uppercase tracking-[0.12em] text-brand-brown-dark md:mb-5 md:text-lg">
          Ürün Grupları
        </h2>
        <div className="-mx-4 grid grid-cols-2 gap-3 px-4 pb-2 sm:gap-4 md:mx-0 md:grid-cols-4 md:px-0">
          {items.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/urunler?category=${cat.slug}`}
              className="category-hover-card group flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-border bg-white sm:min-h-[240px]"
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-white">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="category-image object-contain p-2 transition duration-500"
                  sizes="(max-width:640px) 45vw, 280px"
                />
              </div>
              <div className="category-label flex min-h-[4.5rem] shrink-0 items-center justify-center border-t border-border px-2 py-2 text-center md:min-h-[4.75rem]">
                <span className="line-clamp-3 text-[10px] font-extrabold uppercase leading-snug tracking-wide text-brand-brown-dark transition-colors group-hover:text-white sm:text-[11px] md:text-xs">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

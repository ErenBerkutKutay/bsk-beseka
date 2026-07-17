import Image from "next/image";
import Link from "next/link";
import { besekaAssets } from "@/lib/beseka/assets";

type CategoryItem = {
  slug: string;
  name: string;
  image: string;
};

const defaultCategories: CategoryItem[] = [
  { slug: "motor-takozlari", name: "Motor Takozları", image: besekaAssets.products.B8376 },
  { slug: "amortisor-takozlari", name: "Amortisör Takozları", image: besekaAssets.products.B8550 },
  { slug: "amortisor-korukleri", name: "Amortisör Körükleri", image: besekaAssets.products.B6850 },
  { slug: "salincak-burclari", name: "Salıncak Burçları", image: besekaAssets.products.B2306 },
  { slug: "turbo-hortumlari", name: "Turbo Hortumları", image: besekaAssets.products.B8359 },
  { slug: "direksiyon-korukleri", name: "Direksiyon Körükleri", image: besekaAssets.products.B6657 },
];

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
        <h2 className="mb-4 text-base font-black uppercase tracking-[0.18em] text-brand-brown-dark md:text-lg">
          Ürün Grupları
        </h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin md:mx-0 md:grid md:auto-rows-fr md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-6">
          {items.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/urunler?category=${cat.slug}`}
              className="category-hover-card group flex h-full min-w-[130px] flex-col overflow-hidden rounded-xl border border-border bg-white md:min-w-0"
            >
              <div className="relative min-h-[100px] flex-1 overflow-hidden bg-white">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="category-image object-cover transition duration-500"
                  sizes="(max-width:768px) 130px, 160px"
                />
              </div>
              <div className="category-label mt-auto shrink-0 border-t border-border px-2 py-2.5 text-center">
                <span className="text-xs font-extrabold uppercase tracking-wide text-brand-brown-dark transition-colors group-hover:text-white md:text-sm">
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

import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { HeroCategories } from "@/components/home/hero-categories";
import { HeroSlider } from "@/components/home/hero-slider";
import { HomeCatalogSearch } from "@/components/home/home-catalog-search";
import { HomeIntroSection } from "@/components/home/home-intro-section";
import { HomeStatsBar } from "@/components/home/home-stats-bar";
import { NewProductsMarquee } from "@/components/home/new-products-marquee";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/lib/utils";
import { resolveCategoryLabel } from "@/lib/categories/product-groups";
import { fallbackHomeBanners } from "@/lib/beseka/home-banners";
import { resolveCategoryImage } from "@/lib/categories/display-image";
import { getActiveHomeBanners } from "@/lib/banners";
import { getActiveHomeStats } from "@/lib/home-stats";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCatalog = await getTranslations("catalog");

  const [categories, newProducts, blogPosts, homeBanners, homeStats] = await Promise.all([
    db.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: { isActive: true, isNew: true },
      take: 24,
      orderBy: { createdAt: "desc" },
    }),
    db.blogPost.findMany({
      where: { isPublished: true },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }),
    getActiveHomeBanners(),
    getActiveHomeStats(),
  ]);

  const categoryItems = categories
    .map((cat, index) => {
      const image = resolveCategoryImage({
        slug: cat.slug,
        categoryImage: cat.image,
        index,
      });
      if (!image) return null;
      return {
        slug: cat.slug,
        name: resolveCategoryLabel(cat.slug, locale, cat.name as Record<string, string>),
        image,
      };
    })
    .filter(Boolean) as { slug: string; name: string; image: string }[];

  return (
    <>
      <HeroSlider banners={homeBanners.length ? homeBanners : fallbackHomeBanners} />

      {newProducts.length > 0 && <NewProductsMarquee products={newProducts as never[]} />}

      <HeroCategories
        locale={locale}
        categories={categoryItems}
        sectionTitle={tCatalog("categoryBrowseTitle")}
      />

      <HomeIntroSection locale={locale} />

      <HomeStatsBar stats={homeStats} />

      <HomeCatalogSearch />

      {/* Haberler */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-brand-brown-dark md:text-3xl">
              {t("newsTitle")}
            </h2>
            <Link href={`/${locale}/blog`}>
              <Button variant="outline" size="sm">
                Tüm Haberler
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white transition hover:border-brand-brown/30 hover:shadow-md"
              >
                {post.coverImage ? (
                  <div className="relative aspect-[16/10] bg-brand-cream-light">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-brand-cream-light text-4xl font-black text-brand-brown/20">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-brand-brown-dark group-hover:text-brand-brown">
                    {getLocalizedText(post.title as { tr: string }, locale)}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted">
                      {getLocalizedText(post.excerpt as { tr: string }, locale)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bülten */}
      <section className="bg-brand-brown py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t("newsletterTitle")}</h2>
          <p className="mt-3 text-brand-cream/80">{t("newsletterDesc")}</p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 rounded-lg border border-brand-cream/30 bg-brand-brown-dark/50 px-4 py-3 text-white placeholder:text-brand-cream/50 focus:border-brand-cream focus:outline-none"
            />
            <Button type="button" className="text-brand-brown-dark">
              Abone Ol
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}

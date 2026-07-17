import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { HeroCategories } from "@/components/home/hero-categories";
import { HeroSlider } from "@/components/home/hero-slider";
import { HomeCatalogSearch } from "@/components/home/home-catalog-search";
import { HomeStatsBar } from "@/components/home/home-stats-bar";
import { NewProductsShowcase } from "@/components/home/new-products-showcase";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/lib/utils";
import { besekaAssets } from "@/lib/beseka/assets";
import { fallbackHomeBanners } from "@/lib/beseka/home-banners";
import { resolveCategoryImage } from "@/lib/categories/display-image";
import { getActiveHomeBanners } from "@/lib/banners";
import { getActiveHomeStats } from "@/lib/home-stats";
import { ArrowRight } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [categories, newProducts, blogPosts, homeBanners, homeStats] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isActive: true, images: { isEmpty: false } },
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: { images: true },
        },
      },
    }),
    db.product.findMany({
      where: { isActive: true, isNew: true },
      take: 8,
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

  const categoryItems = categories.map((cat, index) => ({
    slug: cat.slug,
    name: getLocalizedText(cat.name as { tr: string }, locale),
    image: resolveCategoryImage({
      slug: cat.slug,
      categoryImage: cat.image,
      productImage: cat.products[0]?.images[0],
      index,
    }),
  }));

  return (
    <>
      <HeroSlider banners={homeBanners.length ? homeBanners : fallbackHomeBanners} />

      {/* Yeni ürünler promo + vitrin */}
      <section className="bg-gradient-to-r from-brand-cream-light via-brand-cream/40 to-brand-cream-light">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-brown">
              Yeni Ürünler
            </p>
            <p className="mt-1 text-sm font-medium text-brand-brown-dark md:text-base">
              Kataloga eklenen son motor takozu ve süspansiyon parçalarını inceleyin.
            </p>
          </div>
          <Link href={`/${locale}/yeni-urunler`}>
            <Button className="gap-2 whitespace-nowrap">
              Ürünleri Görüntüle
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {newProducts.length > 0 && (
        <section className="bg-white py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4">
            <NewProductsShowcase products={newProducts as never[]} />
          </div>
        </section>
      )}

      <HeroCategories locale={locale} categories={categoryItems} />

      {/* Kurumsal tanıtım */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-brown-mid">
                Beseka Otomotiv
              </p>
              <h2 className="mt-2 text-2xl font-bold text-brand-brown-dark md:text-3xl">
                {t("heroTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Beseka Otomotiv, yedek parça sektörünün önde gelen üreticilerinden biridir. Aynı
                üretim tesisinde motor takozu, amortisör takozu, körük ve salıncak burçları ile
                dünya genelindeki müşterilerine hizmet sunmaktadır.
              </p>
              <p className="mt-3 leading-relaxed text-muted">{t("heroSubtitle")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/${locale}/kurumsal/hakkimizda`}>
                  <Button variant="outline">Hakkımızda</Button>
                </Link>
                <Link href={`/${locale}/urunler`}>
                  <Button variant="secondary" className="gap-2">
                    Online Katalog
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-brand-cream-light shadow-lg">
              <Image
                src={besekaAssets.hero[0]}
                alt="Beseka üretim"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

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

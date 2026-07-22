import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHomeIntroContent } from "@/lib/home-intro";
import { getLocalizedText } from "@/lib/utils";

export async function HomeIntroSection({ locale }: { locale: string }) {
  const intro = await getHomeIntroContent();
  if (!intro.isActive) return null;

  const eyebrow = getLocalizedText(intro.eyebrow, locale);
  const title = getLocalizedText(intro.title, locale);
  const body = getLocalizedText(intro.body, locale);
  const subtitle = getLocalizedText(intro.subtitle, locale);
  const primaryLabel = getLocalizedText(intro.primaryLabel, locale);
  const secondaryLabel = getLocalizedText(intro.secondaryLabel, locale);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-brown-mid">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-2 text-2xl font-bold text-brand-brown-dark md:text-3xl">{title}</h2>
            {body && <p className="mt-4 leading-relaxed text-muted">{body}</p>}
            {subtitle && <p className="mt-3 leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryLabel && (
                <Link href={`/${locale}${intro.primaryHref}`}>
                  <Button variant="outline">{primaryLabel}</Button>
                </Link>
              )}
              {secondaryLabel && (
                <Link href={`/${locale}${intro.secondaryHref}`}>
                  <Button variant="secondary" className="gap-2">
                    {secondaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {intro.image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-brand-cream-light shadow-lg">
              <Image
                src={intro.image}
                alt={title || "Beseka"}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

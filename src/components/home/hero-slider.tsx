"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBannerItem } from "@/lib/beseka/home-banners";

const INTERVAL_MS = 6000;

export function HeroSlider({ banners }: { banners: HeroBannerItem[] }) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => setActive((index + banners.length) % banners.length),
    [banners.length],
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    setActive(0);
  }, [banners]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  if (!banners.length) return null;

  const current = banners[active];

  return (
    <section
      className="hero-slider group relative w-full bg-brand-brown-dark shadow-[0_24px_48px_-12px_rgba(227,24,55,0.12)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ana sayfa bannerları"
    >
      <div className="hero-slider-track overflow-hidden rounded-b-[2rem] md:rounded-b-[2.5rem]">
        {banners.map((banner, index) => {
          const isActive = index === active;
          const key = banner.id ?? banner.image;
          return (
            <div
              key={key}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                isActive ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              <div className="hero-slide-media absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
              </div>
              <div className="hero-slide-shade pointer-events-none absolute inset-0" />
            </div>
          );
        })}

        <Link
          href={`/${locale}${current.href}`}
          className="absolute inset-0 z-[15]"
          aria-label={current.alt}
        />

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prev();
              }}
              aria-label="Önceki banner"
              className="hero-nav-btn absolute left-4 top-1/2 z-20 -translate-y-1/2 opacity-90 transition-all duration-300 md:left-6 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                next();
              }}
              aria-label="Sonraki banner"
              className="hero-nav-btn absolute right-4 top-1/2 z-20 -translate-y-1/2 opacity-90 transition-all duration-300 md:right-6 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20">
          {banners.length > 1 && (
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 pb-4 pt-10 md:px-8 md:pb-5">
              <div className="flex items-center gap-2">
                {banners.map((banner, index) => {
                  const key = banner.id ?? banner.image;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={`Banner ${index + 1}`}
                      aria-current={index === active}
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(index);
                      }}
                      className={`hero-dot transition-all duration-500 ${
                        index === active
                          ? "hero-dot-active w-8"
                          : "w-2 opacity-60 hover:opacity-90"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="hidden rounded-full bg-white/90 px-3 py-1 text-xs font-medium tabular-nums text-brand-brown-dark shadow-sm sm:inline">
                {active + 1} / {banners.length}
              </span>
            </div>
          )}

          {banners.length > 1 && (
            <div className="hero-progress-track h-1">
              <div
                key={active}
                className="hero-progress-bar h-full"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

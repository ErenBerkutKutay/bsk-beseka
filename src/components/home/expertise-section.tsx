"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Cog, Shield, Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const expertise = [
  {
    icon: Cog,
    title: "Motor Takozları",
    desc: "Kauçuk-metal birleşim teknolojisiyle titreşim ve gürültüyü minimize eden motor takozları.",
    href: "/urunler?category=motor-sanziman-takozlari",
  },
  {
    icon: Wrench,
    title: "Amortisör Takozları",
    desc: "Hassas CNC işleme ve vulkanizasyon ile üretilen süspansiyon takozları ve bilyaları.",
    href: "/urunler?category=amortisor-takozlari",
  },
  {
    icon: Shield,
    title: "Kalite Kontrol",
    desc: "Her parça OEM standartlarında test edilir. AR-GE laboratuvarımızda saha validasyonu.",
    href: "/arge/kalite-kontrol",
  },
  {
    icon: Zap,
    title: "Hızlı OEM Arama",
    desc: "Tire, boşluk, nokta fark etmeksizin OEM ve cross kod ile anında ürün eşleştirme.",
    href: "/urunler",
  },
];

export function ExpertiseSection() {
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-expertise-card]"),
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: el, start: "top 80%" },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,218,185,0.3)_0%,transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-brown-mid">
            Uzmanlık Alanlarımız
          </p>
          <h2 className="mt-3 text-3xl font-bold text-brand-brown-dark md:text-4xl">
            Motor Takozu & Süspansiyon Çözümleri
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            35 yılı aşkın deneyimle otomotiv yedek parça üretiminde mühendislik ve kalite odaklı
            üretim.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {expertise.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={`/${locale}${item.href}`}
                data-expertise-card
                className="card-hover group relative overflow-hidden rounded-2xl border border-border bg-brand-cream-light/50 p-6"
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-cream/40 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-brand-brown p-3 text-brand-cream transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-brown-dark">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand-brown-mid transition-colors group-hover:text-brand-brown">
                    Keşfet →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href={`/${locale}/urunler`}>
            <Button size="lg" className="text-brand-brown-dark">
              Tüm Ürünleri İncele
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

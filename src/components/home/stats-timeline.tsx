"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { besekaAssets } from "@/lib/beseka/assets";

const stats = [
  { value: 35, suffix: "+", label: "Yıllık Deneyim" },
  { value: 5000, suffix: "+", label: "Ürün Çeşidi" },
  { value: 40, suffix: "+", label: "İhracat Ülkesi" },
  { value: 100, suffix: "%", label: "Kalite Odaklı Üretim" },
];

export function StatsSection() {
  const t = useTranslations("home");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;

    const counters = el.querySelectorAll("[data-count]");
    counters.forEach((counter, i) => {
      const target = Number(counter.getAttribute("data-count") || 0);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2.2,
        delay: i * 0.1,
        scrollTrigger: { trigger: counter, start: "top 85%" },
        onUpdate: () => {
          counter.textContent = Math.round(obj.val).toLocaleString("tr-TR");
        },
      });
    });

    gsap.fromTo(
      el.querySelectorAll("[data-stat-card]"),
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: el, start: "top 80%" },
      },
    );
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-brand-brown py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,218,185,0.12)_0%,transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          {t("goalsTitle")}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              data-stat-card
              className="rounded-2xl border border-brand-cream/20 bg-brand-brown-dark/40 p-6 text-center backdrop-blur-sm transition-transform hover:scale-105"
            >
              <div className="text-4xl font-black text-brand-cream md:text-5xl">
                <span data-count={stat.value}>0</span>
                {stat.suffix}
              </div>
              <p className="mt-2 text-brand-cream/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TimelineSection() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const milestones = [
    { year: "1989", text: "Beseka Otomotiv kuruldu — motor takozu üretimine başladı" },
    { year: "2000", text: "İlk ihracat operasyonları başladı" },
    { year: "2010", text: "AR-GE merkezi ve kalıphane devreye alındı" },
    { year: "2020", text: "Dijital dönüşüm ve OEM katalog sistemi" },
    { year: "2026", text: "Automechanika Frankfurt katılımı" },
  ];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const line = el.querySelector("[data-timeline-line]");
    if (line) {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 70%" },
        },
      );
    }

    gsap.fromTo(
      el.querySelectorAll("[data-milestone]"),
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 75%" },
      },
    );

    gsap.fromTo(
      el.querySelectorAll("[data-journey-img]"),
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 80%" },
      },
    );
  }, []);

  return (
    <section ref={ref} className="bg-brand-cream-light/30 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-12 text-3xl font-bold text-brand-brown-dark md:text-4xl">
          {t("journeyTitle")}
        </h2>
        <div className="mb-14 grid gap-4 md:grid-cols-3">
          {besekaAssets.journey.map((src, i) => (
            <div
              key={src}
              data-journey-img
              className="card-hover group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm"
            >
              <Image
                src={src}
                alt={`Beseka üretim ${i + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-brown-dark/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
        <div className="relative pl-8">
          <div
            data-timeline-line
            className="absolute bottom-0 left-[7px] top-0 w-0.5 origin-top bg-brand-brown"
          />
          {milestones.map((item) => (
            <div key={item.year} data-milestone className="relative mb-10">
              <span className="absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full bg-brand-cream ring-4 ring-brand-cream-light animate-pulse-ring" />
              <div className="text-sm font-bold text-brand-brown">{item.year}</div>
              <p className="mt-1 text-lg text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

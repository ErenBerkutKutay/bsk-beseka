"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { besekaAssets } from "@/lib/beseka/assets";

export function SiteFooter() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const prefix = `/${locale}`;

  return (
    <footer className="mt-auto border-t-4 border-brand-brown bg-[#0a0a0a] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-4">
        <div>
          <Image
            src={besekaAssets.logoDark}
            alt="Beseka Otomotiv"
            width={160}
            height={36}
            className="h-9 w-[148px] object-contain object-left"
          />
          <p className="mt-4 text-sm leading-relaxed text-brand-cream/70">{tFooter("tagline")}</p>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-brand-cream">{tNav("corporate")}</h3>
          <ul className="space-y-2.5 text-sm text-brand-cream/70">
            <li>
              <Link href={`${prefix}/kurumsal/hakkimizda`} className="transition-colors hover:text-brand-cream">
                {tFooter("aboutUs")}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/kurumsal/kvkk`} className="transition-colors hover:text-brand-cream">
                {tFooter("kvkk")}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/iletisim`} className="transition-colors hover:text-brand-cream">
                {tNav("contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-brand-cream">{tNav("products")}</h3>
          <ul className="space-y-2.5 text-sm text-brand-cream/70">
            <li>
              <Link href={`${prefix}/urunler`} className="transition-colors hover:text-brand-cream">
                {tNav("catalog")}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/yeni-urunler`} className="transition-colors hover:text-brand-cream">
                {tNav("newProducts")}
              </Link>
            </li>
            <li>
              <Link href={`${prefix}/blog`} className="transition-colors hover:text-brand-cream">
                {tNav("blog")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-brand-cream">{tFooter("support")}</h3>
          <p className="text-sm text-brand-cream/70">7/24: +90 (224) 482 44 55</p>
          <p className="mt-2 text-sm text-brand-cream/70">info@beseka.com</p>
        </div>
      </div>
      <div className="border-t border-brand-brown py-5 text-center text-sm text-brand-cream/50">
        © {new Date().getFullYear()} Beseka Otomotiv. {tFooter("rights")}
      </div>
    </footer>
  );
}

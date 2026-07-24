import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT = {
  companyName: "Beseka Otomotiv San. ve Tic. Ltd. Şti.",
  address: "Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri",
  phone: "+90 (224) 482 44 55",
  email: "info@beseka.com",
  image: "/beseka/home-contact-facility.png",
};

export async function HomeContactSection({ locale }: { locale: string }) {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[420px] overflow-hidden md:min-h-[480px]">
      <Image
        src={CONTACT.image}
        alt={CONTACT.companyName}
        fill
        className="object-cover"
        sizes="100vw"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-brown-dark/90 via-brand-brown-dark/75 to-brand-brown-dark/55" />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-4 py-16 md:min-h-[480px] md:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream/80">
            Beseka
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{t("contactTitle")}</h2>

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-white/95 md:text-base">
            <p className="text-lg font-semibold text-white">{CONTACT.companyName}</p>
            <p className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <span>{CONTACT.address}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-brand-cream">
                {CONTACT.phone}
              </a>
            </p>
            <p className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <a href={`mailto:${CONTACT.email}`} className="hover:text-brand-cream">
                {CONTACT.email}
              </a>
            </p>
          </div>

          <Link href={`/${locale}/iletisim/bilgiler`} className="mt-8 inline-block">
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              {t("contactMore")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

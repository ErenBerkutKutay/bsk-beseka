import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHomeContactContent } from "@/lib/home-contact";
import { hexToRgba } from "@/lib/beseka/home-contact";
import { getLocalizedText } from "@/lib/utils";

export async function HomeContactSection({ locale }: { locale: string }) {
  const contact = await getHomeContactContent();

  if (!contact.isActive) return null;

  const eyebrow = getLocalizedText(contact.eyebrow, locale);
  const title = getLocalizedText(contact.title, locale);
  const companyName = getLocalizedText(contact.companyName, locale);
  const address = getLocalizedText(contact.address, locale);
  const buttonLabel = getLocalizedText(contact.buttonLabel, locale);
  const buttonHref = contact.buttonHref.startsWith("/")
    ? `/${locale}${contact.buttonHref}`
    : contact.buttonHref;

  const textPanelStyle = contact.textPanelEnabled
    ? { backgroundColor: hexToRgba(contact.textPanelColor, contact.textPanelOpacity) }
    : undefined;

  return (
    <section className="relative min-h-[420px] overflow-hidden md:min-h-[480px]">
      <Image
        src={contact.image}
        alt={companyName}
        fill
        className="object-cover"
        sizes="100vw"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-brown-dark/90 via-brand-brown-dark/75 to-brand-brown-dark/55" />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-4 py-16 md:min-h-[480px] md:py-20">
        <div className="max-w-xl rounded-xl p-6 md:p-8" style={textPanelStyle}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream/80">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{title}</h2>

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-white/95 md:text-base">
            <p className="text-lg font-semibold text-white">{companyName}</p>
            <p className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <span>{address}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-brand-cream">
                {contact.phone}
              </a>
            </p>
            <p className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <a href={`mailto:${contact.email}`} className="hover:text-brand-cream">
                {contact.email}
              </a>
            </p>
          </div>

          <Link href={buttonHref} className="mt-8 inline-block">
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              {buttonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

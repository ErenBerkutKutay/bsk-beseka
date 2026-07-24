import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hexToRgba } from "@/lib/beseka/home-contact";

export type HomeContactPreviewProps = {
  eyebrow: string;
  title: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  buttonLabel: string;
  textPanelEnabled: boolean;
  textPanelColor: string;
  textPanelOpacity: number;
  compact?: boolean;
};

export function HomeContactPreview({
  eyebrow,
  title,
  companyName,
  address,
  phone,
  email,
  image,
  buttonLabel,
  textPanelEnabled,
  textPanelColor,
  textPanelOpacity,
  compact = false,
}: HomeContactPreviewProps) {
  const textPanelStyle = textPanelEnabled
    ? { backgroundColor: hexToRgba(textPanelColor, textPanelOpacity) }
    : undefined;

  const minHeight = compact ? "min-h-[320px]" : "min-h-[420px] md:min-h-[480px]";

  return (
    <section className={`relative overflow-hidden ${minHeight}`}>
      {image ? (
        <Image
          src={image}
          alt={companyName || "İletişim"}
          fill
          className="object-cover"
          sizes="100vw"
          unoptimized={image.startsWith("blob:")}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-400 to-zinc-600" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-brown-dark/90 via-brand-brown-dark/75 to-brand-brown-dark/55" />
      <div className="absolute inset-0 bg-black/25" />

      <div
        className={`relative mx-auto flex ${minHeight} max-w-7xl flex-col justify-center px-4 py-10 md:py-16`}
      >
        <div
          className={`max-w-xl rounded-xl ${compact ? "p-4 md:p-5" : "p-6 md:p-8"}`}
          style={textPanelStyle}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream/80">
            {eyebrow || "Beseka"}
          </p>
          <h2
            className={`mt-3 font-bold text-white ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"}`}
          >
            {title || "İletişim"}
          </h2>

          <div
            className={`space-y-4 leading-relaxed text-white/95 ${compact ? "mt-6 text-sm" : "mt-8 text-sm md:text-base"}`}
          >
            <p className={`font-semibold text-white ${compact ? "text-base" : "text-lg"}`}>
              {companyName || "Firma adı"}
            </p>
            <p className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <span>{address || "Adres bilgisi"}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <span>{phone || "+90 ..."}</span>
            </p>
            <p className="flex gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-cream" />
              <span>{email || "info@beseka.com"}</span>
            </p>
          </div>

          <div className={`${compact ? "mt-6" : "mt-8"} inline-block`}>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="pointer-events-none border-white/40 bg-white/10 text-white backdrop-blur-sm"
            >
              {buttonLabel || "Tüm İletişim Bilgileri"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

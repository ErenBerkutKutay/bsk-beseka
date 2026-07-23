import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  localizedMetaText,
  parseContactMetadata,
  type ContactPageMetadata,
} from "@/lib/contact/page-metadata";
import { getLocalizedText } from "@/lib/utils";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  role?: unknown;
};

export function ContactPageHero({
  title,
  subtitle,
  heroImage,
}: {
  title: string;
  subtitle?: string;
  heroImage?: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-brown-dark text-white">
      {heroImage ? (
        <>
          <Image src={heroImage} alt={title} fill className="object-cover opacity-40" priority sizes="100vw" />
          <div className="absolute inset-0 bg-brand-brown-dark/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,171,122,0.25),transparent_55%)]" />
      )}
      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-cream/80">İletişim</p>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 md:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}

export function ContactInfoView({
  locale,
  title,
  content,
  heroImage,
  metadataRaw,
  teamMembers,
}: {
  locale: string;
  title: string;
  content: string;
  heroImage?: string | null;
  metadataRaw: unknown;
  teamMembers: TeamMember[];
}) {
  const metadata = parseContactMetadata(metadataRaw);
  const teamTitle = localizedMetaText(metadata.teamSectionTitle, locale, "Satış Ekibi");

  return (
    <div>
      <ContactPageHero
        title={title}
        subtitle={localizedMetaText(metadata.subtitle, locale, content)}
        heroImage={heroImage}
      />

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="bg-brand-brown px-6 py-4 text-center text-lg font-bold text-white">{teamTitle}</div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <article
                key={member.id}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/5] bg-brand-cream-light">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} fill className="object-cover" sizes="300px" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-cream-light to-white text-4xl font-bold text-brand-brown/30">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="px-4 py-4 text-center">
                  <h3 className="text-lg font-bold text-brand-brown-dark">{member.name}</h3>
                  {typeof member.role === "object" && member.role !== null ? (
                    <p className="mt-1 text-sm text-muted">
                      {getLocalizedText(member.role as Record<string, string>, locale)}
                    </p>
                  ) : null}
                  <a href={`mailto:${member.email}`} className="mt-2 inline-block text-sm font-semibold text-brand-brown">
                    {member.email}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactCompanyFooter metadata={metadata} heroImage={heroImage} />
    </div>
  );
}

export function ContactDirectionsView({
  locale,
  title,
  content,
  heroImage,
  metadataRaw,
}: {
  locale: string;
  title: string;
  content: string;
  heroImage?: string | null;
  metadataRaw: unknown;
}) {
  const metadata = parseContactMetadata(metadataRaw);
  const html = /<[a-z][\s\S]*>/i.test(content) ? content : content.replace(/\n/g, "<br/>");

  return (
    <div>
      <ContactPageHero title={title} heroImage={heroImage} />

      <section className="relative min-h-[420px]">
        <div className="absolute inset-0">
          <iframe
            title="Beseka Harita"
            src={metadata.mapEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-xl border border-border bg-white/95 p-6 shadow-xl backdrop-blur-sm">
            <div className="prose-content space-y-4" dangerouslySetInnerHTML={{ __html: html }} />
            {metadata.mapLink && (
              <Link
                href={metadata.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-lg bg-brand-brown px-4 py-2 text-sm font-semibold text-white hover:bg-brand-brown-dark"
              >
                Google Maps&apos;te Aç
              </Link>
            )}
          </div>
        </div>
      </section>

      <ContactCompanyFooter metadata={metadata} heroImage={heroImage} compact />
    </div>
  );
}

function ContactCompanyFooter({
  metadata,
  heroImage,
  compact = false,
}: {
  metadata: ContactPageMetadata;
  heroImage?: string | null;
  compact?: boolean;
}) {
  return (
    <section className="border-t border-border bg-zinc-100">
      <div className={`mx-auto grid max-w-6xl gap-8 px-4 ${compact ? "py-10" : "py-12"} md:grid-cols-[280px_1fr]`}>
        {heroImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <Image src={heroImage} alt={metadata.companyName || "Beseka"} fill className="object-cover" sizes="280px" />
          </div>
        )}
        <div className="space-y-4">
          {metadata.companyName && (
            <h2 className="text-xl font-bold text-brand-brown-dark">{metadata.companyName}</h2>
          )}
          <div className="space-y-3 text-sm text-brand-brown-dark">
            {metadata.address && (
              <p className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-brown" />
                <span>{metadata.address}</span>
              </p>
            )}
            {metadata.postalCode && <p>Posta Kodu: {metadata.postalCode}</p>}
            {metadata.gps && <p>GPS: {metadata.gps}</p>}
            {metadata.phone && (
              <p className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-brown" />
                <a href={`tel:${metadata.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {metadata.phone}
                </a>
              </p>
            )}
            {metadata.fax && <p>Fax: {metadata.fax}</p>}
            {metadata.email && (
              <p className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-brown" />
                <a href={`mailto:${metadata.email}`} className="hover:underline">
                  {metadata.email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

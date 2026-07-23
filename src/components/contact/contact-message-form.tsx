"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { ContactPageMetadata } from "@/lib/contact/page-metadata";

type ContactMessageFormProps = {
  metadata: ContactPageMetadata;
  intro?: string;
};

export function ContactMessageForm({ metadata, intro }: ContactMessageFormProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="bg-brand-brown px-6 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <Mail className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
        <div className="space-y-4 rounded-xl bg-zinc-50 p-5">
          <h2 className="text-lg font-bold text-brand-brown-dark">İletişim Bilgileri</h2>
          {metadata.phone && (
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Telefon</span>
              <a href={`tel:${metadata.phone.replace(/\s/g, "")}`} className="font-medium text-brand-brown">
                {metadata.phone}
              </a>
            </p>
          )}
          {metadata.email && (
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">E-posta</span>
              <a href={`mailto:${metadata.email}`} className="font-medium text-brand-brown">
                {metadata.email}
              </a>
            </p>
          )}
          {metadata.address && (
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Adres</span>
              <span className="text-sm leading-relaxed text-brand-brown-dark">{metadata.address}</span>
            </p>
          )}
        </div>

        <form className="space-y-4">
          {intro && <p className="text-sm leading-relaxed text-muted">{intro}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Adınız</Label>
              <Input name="firstName" required />
            </div>
            <div>
              <Label>Soyadınız</Label>
              <Input name="lastName" required />
            </div>
          </div>
          <div>
            <Label>Firma Adınız</Label>
            <Input name="company" />
          </div>
          <div>
            <Label>E-posta Adresiniz</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Konu</Label>
            <Input name="subject" />
          </div>
          <div>
            <Label>Mesajınız</Label>
            <Textarea name="message" rows={6} required />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" name="kvkk" required className="mt-1" />
            <span>
              <Link href={metadata.kvkkHref || "/tr/kurumsal/kvkk"} className="text-brand-brown hover:underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum, kabul ediyorum.
            </span>
          </label>
          <Button type="submit" className="w-full bg-brand-brown hover:bg-brand-brown-dark">
            Mesaj Gönder
          </Button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function NewsletterSubscriptionForm() {
  const t = useTranslations("media");
  const locale = useLocale();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-green-900">{t("newsletterSuccessTitle")}</p>
        <p className="mt-2 text-sm text-green-800">{t("newsletterSuccessDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold text-brand-brown-dark">{t("newsletterFormTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("newsletterFormDesc")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>

      <div>
        <Label htmlFor="company">{t("companyName")}</Label>
        <Input id="company" name="company" />
      </div>

      <div>
        <Label htmlFor="country">{t("country")}</Label>
        <Input id="country" name="country" />
      </div>

      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" name="kvkk" required className="mt-1" />
        <span>
          <Link href={`/${locale}/kurumsal/kvkk`} className="text-brand-brown hover:underline">
            {t("kvkkText")}
          </Link>
        </span>
      </label>

      <Button type="submit" className="w-full bg-brand-brown hover:bg-brand-brown-dark">
        {t("newsletterSubmit")}
      </Button>
    </form>
  );
}

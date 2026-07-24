import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { NewsletterSubscriptionForm } from "@/components/media/newsletter-subscription-form";

export default async function NewsletterSubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("media");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <h1 className="mb-8 text-center text-3xl font-bold text-brand-brown-dark">{t("newsletterPageTitle")}</h1>
      <NewsletterSubscriptionForm />
    </div>
  );
}

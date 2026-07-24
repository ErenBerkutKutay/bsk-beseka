import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function BlogSlugRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/medya/haberler/${slug}`);
}

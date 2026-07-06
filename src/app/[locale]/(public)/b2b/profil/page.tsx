import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function B2BPlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/b2b/dashboard`);
}

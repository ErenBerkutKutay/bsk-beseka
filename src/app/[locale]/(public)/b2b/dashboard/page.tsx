import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function B2BDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/b2b`);

  const links = [
    { href: `/${locale}/b2b/siparisler`, label: "Siparişlerim" },
    { href: `/${locale}/b2b/kredi-fisleri`, label: "Kredi Fişlerim" },
    { href: `/${locale}/b2b/adres`, label: "Adresim" },
    { href: `/${locale}/b2b/profil`, label: "Kişisel Bilgilerim" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">B2B Paneli</h1>
          <p className="text-zinc-500">Hoş geldiniz, {session.user.name || session.user.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: `/${locale}/b2b` });
          }}
        >
          <Button variant="outline" type="submit">
            Çıkış Yap
          </Button>
        </form>
      </div>

      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Sipariş entegrasyonu yakında aktif olacaktır. Şimdilik katalog üzerinden ürün arayabilirsiniz.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200 p-6 hover:shadow-md"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href={`/${locale}/urunler`}
          className="rounded-xl border border-red-200 bg-red-50 p-6 font-medium text-red-700 hover:shadow-md"
        >
          Ürün Kataloğuna Git →
        </Link>
      </div>
    </div>
  );
}

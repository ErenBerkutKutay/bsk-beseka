import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export const dynamic = "force-dynamic";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/urunler/toplu", label: "Toplu Ürün Yükle" },
  { href: "/admin/urunler/gorseller", label: "Toplu Ürün Görseli" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/kategoriler/gorseller", label: "Toplu Grup Görseli" },
  { href: "/admin/bannerlar", label: "Bannerlar" },
  { href: "/admin/ana-sayfa-bilgilendirme", label: "Ana Sayfa Bilgilendirme" },
  { href: "/admin/istatistikler", label: "İstatistikler" },
  { href: "/admin/blog", label: "Blog (Bizden Haberler)" },
  { href: "/admin/sayfalar", label: "Sayfalar" },
  { href: "/admin/iletisim-sayfalari", label: "İletişim Sayfaları" },
  { href: "/admin/kalite-sayfasi", label: "Kalite Sayfası" },
  { href: "/admin/kullanicilar", label: "Kullanıcılar" },
  { href: "/admin/arac-import", label: "Araç Kataloğu" },
];

export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/admin/giris`);
  }

  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-brand-cream-light/40">
      <div className="border-b border-brand-brown bg-brand-brown-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href={`${prefix}/admin`} className="font-bold">
            <span className="text-brand-cream">BESEKA</span> Admin
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`${prefix}`} className="text-sm text-brand-cream/80 hover:text-white">
              Siteye Dön
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-zinc-200 bg-white p-4">
          <nav className="space-y-1">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={`${prefix}${item.href}`}
                className="block rounded-md px-3 py-2 text-sm text-brand-brown-dark transition hover:bg-brand-cream-light hover:text-brand-brown"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

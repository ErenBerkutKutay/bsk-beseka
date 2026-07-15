import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/input";
import { getAdminAnalyticsReports } from "@/lib/analytics";
import { getLocalizedText } from "@/lib/utils";
import { BarChart3, Eye, MousePointerClick, Search } from "lucide-react";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function AdminAnalyticsReports({ locale }: { locale: string }) {
  const reports = await getAdminAnalyticsReports();

  const summaryCards = [
    {
      label: "Toplam arama",
      value: reports.search.totalQueries.toLocaleString("tr-TR"),
      sub: `${reports.search.uniqueTerms} farklı kelime`,
      icon: Search,
    },
    {
      label: "Ürün görüntüleme",
      value: reports.products.totalViews.toLocaleString("tr-TR"),
      sub: `${reports.products.viewedProducts} ürün tıklandı`,
      icon: Eye,
    },
    {
      label: "En popüler arama",
      value: reports.search.topTerms[0]?.term || "—",
      sub: reports.search.topTerms[0]
        ? `${reports.search.topTerms[0].count} kez arandı`
        : "Henüz veri yok",
      icon: BarChart3,
    },
    {
      label: "En çok tıklanan ürün",
      value: reports.products.topViews[0]?.product.sku || "—",
      sub: reports.products.topViews[0]
        ? `${reports.products.topViews[0].count} görüntülenme`
        : "Henüz veri yok",
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-brand-brown-dark">Site Raporları</h2>
        <p className="mt-1 text-sm text-muted">
          Katalog aramaları ve ürün detay tıklamalarından otomatik toplanır.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm text-zinc-500">{card.label}</div>
                <Icon className="h-4 w-4 text-brand-brown/70" />
              </CardHeader>
              <CardContent>
                <div className="truncate text-2xl font-bold text-brand-brown-dark">
                  {card.value}
                </div>
                <p className="mt-1 text-xs text-muted">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-brand-brown-dark">En Çok Aranan Kelimeler</h3>
            <p className="text-sm text-muted">Katalog ve ana sayfa aramaları</p>
          </CardHeader>
          <CardContent>
            {reports.search.topTerms.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Kelime</th>
                      <th className="py-2 pr-3">Arama</th>
                      <th className="py-2">Son arama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.search.topTerms.map((item, index) => (
                      <tr key={item.id} className="border-b border-border/60">
                        <td className="py-3 pr-3 text-muted">{index + 1}</td>
                        <td className="py-3 pr-3 font-medium text-brand-brown-dark">
                          {item.term}
                        </td>
                        <td className="py-3 pr-3 font-semibold text-brand-brown">
                          {item.count.toLocaleString("tr-TR")}
                        </td>
                        <td className="py-3 text-xs text-muted">{formatDate(item.lastAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">
                Henüz arama verisi yok. Sitede arama yapıldıkça burada görünecek.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-brand-brown-dark">En Çok Tıklanan Ürünler</h3>
            <p className="text-sm text-muted">Ürün detay sayfası görüntülenmeleri</p>
          </CardHeader>
          <CardContent>
            {reports.products.topViews.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">SKU</th>
                      <th className="py-2 pr-3">Ürün</th>
                      <th className="py-2 pr-3">Tıklama</th>
                      <th className="py-2">Son</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.products.topViews.map((item, index) => {
                      const name = getLocalizedText(item.product.name as { tr: string }, "tr");
                      return (
                        <tr key={item.id} className="border-b border-border/60">
                          <td className="py-3 pr-3 text-muted">{index + 1}</td>
                          <td className="py-3 pr-3">
                            <Link
                              href={`/${locale}/admin/urunler/${item.product.id}`}
                              className="font-mono font-bold text-brand-brown hover:underline"
                            >
                              {item.product.sku}
                            </Link>
                          </td>
                          <td className="max-w-[180px] truncate py-3 pr-3 text-brand-brown-dark">
                            {name}
                          </td>
                          <td className="py-3 pr-3 font-semibold text-brand-brown">
                            {item.count.toLocaleString("tr-TR")}
                          </td>
                          <td className="py-3 text-xs text-muted">{formatDate(item.lastAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">
                Henüz ürün tıklama verisi yok. Ürün detayları açıldıkça burada görünecek.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

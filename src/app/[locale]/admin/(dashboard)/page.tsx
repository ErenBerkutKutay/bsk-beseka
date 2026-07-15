import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/input";
import { AdminAnalyticsReports } from "@/components/admin/admin-analytics-reports";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [productCount, categoryCount, blogCount, userCount] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.blogPost.count(),
    db.user.count(),
  ]);

  const stats = [
    { label: "Ürünler", value: productCount },
    { label: "Kategoriler", value: categoryCount },
    { label: "Blog Yazıları", value: blogCount },
    { label: "Kullanıcılar", value: userCount },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-brand-brown-dark">Yönetim Paneli</h1>
        <p className="mt-1 text-sm text-muted">Genel özet ve site kullanım raporları</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminAnalyticsReports locale={locale} />
    </div>
  );
}

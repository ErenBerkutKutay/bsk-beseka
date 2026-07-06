import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/input";

export default async function AdminDashboardPage() {
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
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yönetim Paneli</h1>
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
    </div>
  );
}

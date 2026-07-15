import { db } from "@/lib/db";

function normalizeTerm(raw: string) {
  return raw.trim().toLowerCase().slice(0, 120);
}

export async function trackSearchTerm(raw: string) {
  const term = normalizeTerm(raw);
  if (term.length < 2) return;

  try {
    await db.analyticsSearchTerm.upsert({
      where: { term },
      create: { term, count: 1 },
      update: { count: { increment: 1 }, lastAt: new Date() },
    });
  } catch {
    // Analytics should never break user flows.
  }
}

export async function trackProductView(productId: string) {
  if (!productId) return;

  try {
    await db.analyticsProductView.upsert({
      where: { productId },
      create: { productId, count: 1 },
      update: { count: { increment: 1 }, lastAt: new Date() },
    });
  } catch {
    // Analytics should never break user flows.
  }
}

export async function getAdminAnalyticsReports() {
  const [
    productCount,
    categoryCount,
    blogCount,
    userCount,
    topSearchTerms,
    topProductViews,
    searchAgg,
    viewAgg,
  ] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.blogPost.count(),
    db.user.count(),
    db.analyticsSearchTerm.findMany({
      orderBy: [{ count: "desc" }, { lastAt: "desc" }],
      take: 10,
    }),
    db.analyticsProductView.findMany({
      orderBy: [{ count: "desc" }, { lastAt: "desc" }],
      take: 10,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            slug: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
    db.analyticsSearchTerm.aggregate({ _sum: { count: true }, _count: true }),
    db.analyticsProductView.aggregate({ _sum: { count: true }, _count: true }),
  ]);

  return {
    counts: {
      products: productCount,
      categories: categoryCount,
      blogPosts: blogCount,
      users: userCount,
    },
    search: {
      totalQueries: searchAgg._sum.count ?? 0,
      uniqueTerms: searchAgg._count,
      topTerms: topSearchTerms,
    },
    products: {
      totalViews: viewAgg._sum.count ?? 0,
      viewedProducts: viewAgg._count,
      topViews: topProductViews,
    },
  };
}

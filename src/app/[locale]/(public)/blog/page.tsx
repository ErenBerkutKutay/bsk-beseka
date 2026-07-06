import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-brand-brown-dark">Blog & Haberler</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            className="card-hover overflow-hidden rounded-xl border border-border bg-white hover:border-brand-brown hover:shadow-lg"
          >
            {post.coverImage && (
              <div className="relative aspect-[16/9] overflow-hidden bg-brand-cream-light">
                <Image
                  src={post.coverImage}
                  alt={getLocalizedText(post.title as { tr: string }, locale)}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-lg font-bold">
                {getLocalizedText(post.title as { tr: string }, locale)}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm text-muted">
                  {getLocalizedText(post.excerpt as { tr: string }, locale)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

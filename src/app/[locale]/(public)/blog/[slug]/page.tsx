import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await db.blogPost.findUnique({ where: { slug, isPublished: true } });
  if (!post) notFound();

  const content = getLocalizedText(post.content as { tr: string }, locale);
  const html = /<[a-z][\s\S]*>/i.test(content) ? content : content.replace(/\n/g, "<br/>");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {post.coverImage && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-cream-light shadow-md">
          <Image src={post.coverImage} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}
      <h1 className="text-3xl font-bold text-brand-brown-dark">
        {getLocalizedText(post.title as { tr: string }, locale)}
      </h1>
      <div
        className="prose-content mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

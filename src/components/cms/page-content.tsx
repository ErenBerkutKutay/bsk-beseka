import Image from "next/image";

type PageContentProps = {
  title: string;
  content: string;
  heroImage?: string | null;
  images?: string[];
};

export function CmsPageContent({ title, content, heroImage, images = [] }: PageContentProps) {
  const html = /<[a-z][\s\S]*>/i.test(content)
    ? content
    : content.replace(/\n/g, "<br/>");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {heroImage && (
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-brand-cream-light shadow-md">
          <Image src={heroImage} alt={title} fill className="object-cover" priority sizes="(max-width: 896px) 100vw, 896px" />
        </div>
      )}
      <h1 className="text-3xl font-bold text-brand-brown-dark md:text-4xl">{title}</h1>
      <div className="prose-content mt-8" dangerouslySetInnerHTML={{ __html: html }} />
      {images.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-brand-cream-light"
            >
              <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

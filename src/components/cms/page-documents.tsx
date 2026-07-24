import Image from "next/image";
import { Download } from "lucide-react";
import { getLocalizedText } from "@/lib/utils";
import type { QualityPageDocument } from "@/lib/quality/page-metadata";

type PageDocumentsProps = {
  documents: QualityPageDocument[];
  locale: string;
  title?: string;
};

export function PageDocuments({
  documents,
  locale,
  title = "Belgeler",
}: PageDocumentsProps) {
  const sorted = [...documents].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold text-brand-brown-dark">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {sorted.map((doc) => {
          const docTitle = getLocalizedText(doc.title, locale);
          const isImage = doc.mimeType.startsWith("image/");

          if (isImage) {
            return (
              <div
                key={doc.id}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-brand-cream-light">
                  <Image
                    src={doc.fileUrl}
                    alt={docTitle}
                    fill
                    className="object-contain p-2"
                    sizes="400px"
                  />
                </div>
                {docTitle && (
                  <p className="border-t border-border p-4 text-sm font-medium text-brand-brown-dark">
                    {docTitle}
                  </p>
                )}
              </div>
            );
          }

          return (
            <a
              key={doc.id}
              href={doc.fileUrl}
              download={doc.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:border-brand-brown hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-brand-cream-light">
                {doc.coverImage ? (
                  <Image
                    src={doc.coverImage}
                    alt={docTitle}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Download className="h-10 w-10 text-brand-brown/40" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h3 className="font-bold text-brand-brown-dark group-hover:text-brand-brown">
                    {docTitle || doc.fileName}
                  </h3>
                  <p className="mt-1 text-xs text-muted">{doc.fileName}</p>
                </div>
                <Download className="h-5 w-5 shrink-0 text-brand-brown" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

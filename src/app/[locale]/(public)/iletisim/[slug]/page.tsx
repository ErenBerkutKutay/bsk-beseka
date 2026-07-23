import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getLocalizedText } from "@/lib/utils";
import {
  localizedMetaText,
  parseContactMetadata,
} from "@/lib/contact/page-metadata";
import {
  ContactDirectionsView,
  ContactInfoView,
  ContactPageHero,
} from "@/components/contact/contact-page-views";
import { ContactMessageForm } from "@/components/contact/contact-message-form";

export const dynamic = "force-dynamic";

export default async function ContactSubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = await db.page.findFirst({
    where: {
      slug: slug.startsWith("iletisim-") ? slug : `iletisim-${slug}`,
      type: "CONTACT",
      isActive: true,
    },
  });

  if (!page) notFound();

  const title = getLocalizedText(page.title as { tr: string }, locale);
  const content = getLocalizedText(page.content as { tr: string }, locale);
  const metadata = parseContactMetadata(page.metadata);

  if (metadata.template === "info") {
    const teamMembers = await db.contactTeamMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return (
      <ContactInfoView
        locale={locale}
        title={title}
        content={content}
        heroImage={page.heroImage}
        metadataRaw={page.metadata}
        teamMembers={teamMembers}
      />
    );
  }

  if (metadata.template === "message") {
    return (
      <div>
        <ContactPageHero title={title} heroImage={page.heroImage} />
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <ContactMessageForm
            metadata={metadata}
            intro={localizedMetaText(metadata.formIntroTitle, locale, content)}
          />
        </div>
      </div>
    );
  }

  return (
    <ContactDirectionsView
      locale={locale}
      title={title}
      content={content}
      heroImage={page.heroImage}
      metadataRaw={page.metadata}
    />
  );
}

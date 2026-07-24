type NavTranslator = (key: string) => string;

export function getCorporateNavLinks(t: NavTranslator) {
  return [
    { href: "/kurumsal/hakkimizda", label: t("aboutUs") },
    { href: "/kurumsal/kultur", label: t("culture") },
    { href: "/kurumsal/vizyon-misyon", label: t("visionMission") },
    { href: "/kurumsal/degerler", label: t("values") },
    { href: "/kurumsal/surdurulebilirlik", label: t("sustainability") },
  ];
}

export function getProductionNavLinks(t: NavTranslator) {
  return [
    { href: "/uretim/kaynak", label: t("welding") },
    { href: "/uretim/kaliphane", label: t("toolshop") },
    { href: "/uretim/cnc", label: t("cnc") },
    { href: "/uretim/vulkanizasyon", label: t("vulcanization") },
    { href: "/uretim/montaj", label: t("assembly") },
  ];
}

export function getCatalogNavLinks(t: NavTranslator) {
  return [
    { href: "/urunler", label: t("onlineCatalog") },
    { href: "/yeni-urunler", label: t("newProducts") },
  ];
}

export function getContactNavFallbackLinks(t: NavTranslator) {
  return [
    { slug: "bilgiler", href: "/iletisim/bilgiler", label: t("contactInfo") },
    { slug: "mesaj", href: "/iletisim/mesaj", label: t("sendMessage") },
    { slug: "nasil-gidilir", href: "/iletisim/nasil-gidilir", label: t("howToReach") },
  ];
}

export function getMediaNavLinks(t: NavTranslator) {
  return [
    { slug: "bulten-aboneligi", href: "/medya/bulten-aboneligi", label: t("newsletterSubscription") },
    { slug: "haberler", href: "/medya/haberler", label: t("news") },
    { slug: "indirme-merkezi", href: "/medya/indirme-merkezi", label: t("downloadCenter") },
  ];
}

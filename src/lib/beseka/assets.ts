/** Beseka.com sitesinden indirilen yerel medya yolları */
export const besekaAssets = {
  logo: "/beseka/logo/beseka-logo-transparent.png",
  logoDark: "/beseka/logo/beseka-logo-transparent.png",
  favicon: "/beseka/logo/favicon.ico",
  hero: [
    "/beseka/hero/slide-1.webp",
    "/beseka/hero/slide-2.webp",
    "/beseka/hero/slide-3.webp",
  ],
  journey: [
    "/beseka/cms/journey-1.webp",
    "/beseka/cms/journey-2.webp",
    "/beseka/cms/journey-3.webp",
  ],
  blog: {
    automechanika: "/beseka/blog/automechanika.png",
  },
  products: {
    B2306: "/beseka/products/b2306.jpg",
    B2307: "/beseka/products/b2307.jpg",
    B6850: "/beseka/products/b6850.jpg",
    B6657: "/beseka/products/b6657.jpg",
    B6190: "/beseka/products/b6190.jpg",
    B8359: "/beseka/products/b8359.jpg",
    B8550: "/beseka/products/b8550.jpg",
    B8650: "/beseka/products/b8650.jpg",
    "B8306.T": "/beseka/products/b8306t.jpg",
    B8376: "/beseka/products/b8376.jpg",
  },
} as const;

export type BesekaProductSku = keyof typeof besekaAssets.products;

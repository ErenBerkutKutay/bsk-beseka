import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "firebase-admin",
  ],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
    "/api/catalog/export": [
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf",
    ],
  },
};

export default withNextIntl(nextConfig);

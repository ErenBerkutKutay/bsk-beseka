-- CreateTable
CREATE TABLE "HomeIntro" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT 'default',
    "eyebrow" JSONB NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "subtitle" JSONB NOT NULL,
    "image" TEXT NOT NULL,
    "primaryLabel" JSONB NOT NULL,
    "primaryHref" TEXT NOT NULL DEFAULT '/kurumsal/hakkimizda',
    "secondaryLabel" JSONB NOT NULL,
    "secondaryHref" TEXT NOT NULL DEFAULT '/urunler',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeIntro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeIntro_slug_key" ON "HomeIntro"("slug");

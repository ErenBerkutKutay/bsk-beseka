-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

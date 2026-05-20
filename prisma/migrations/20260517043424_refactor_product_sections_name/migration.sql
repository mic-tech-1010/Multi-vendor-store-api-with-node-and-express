/*
  Warnings:

  - You are about to drop the `ProductSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSectionItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HomePageSectionType" AS ENUM ('products', 'categories', 'banner', 'mixed');

-- CreateEnum
CREATE TYPE "HomePageSectionLayout" AS ENUM ('carousel', 'grid_2x2', 'single_grid', 'grid_3x1', 'hero', 'horizontal_scroll');

-- DropForeignKey
ALTER TABLE "ProductSectionItem" DROP CONSTRAINT "ProductSectionItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSectionItem" DROP CONSTRAINT "ProductSectionItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSectionItem" DROP CONSTRAINT "ProductSectionItem_sectionId_fkey";

-- DropTable
DROP TABLE "ProductSection";

-- DropTable
DROP TABLE "ProductSectionItem";

-- DropEnum
DROP TYPE "ProductSectionLayout";

-- DropEnum
DROP TYPE "ProductSectionType";

-- CreateTable
CREATE TABLE "HomePageSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "type" "HomePageSectionType" NOT NULL,
    "layout" "HomePageSectionLayout" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomePageSectionItem" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "productId" INTEGER,
    "categoryId" INTEGER,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HomePageSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePageSection_slug_key" ON "HomePageSection"("slug");

-- CreateIndex
CREATE INDEX "HomePageSection_active_idx" ON "HomePageSection"("active");

-- CreateIndex
CREATE INDEX "HomePageSection_position_idx" ON "HomePageSection"("position");

-- CreateIndex
CREATE UNIQUE INDEX "HomePageSectionItem_sectionId_productId_key" ON "HomePageSectionItem"("sectionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "HomePageSectionItem_sectionId_categoryId_key" ON "HomePageSectionItem"("sectionId", "categoryId");

-- AddForeignKey
ALTER TABLE "HomePageSectionItem" ADD CONSTRAINT "HomePageSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomePageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomePageSectionItem" ADD CONSTRAINT "HomePageSectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomePageSectionItem" ADD CONSTRAINT "HomePageSectionItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

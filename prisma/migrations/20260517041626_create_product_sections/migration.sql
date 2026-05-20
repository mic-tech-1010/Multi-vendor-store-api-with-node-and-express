-- CreateEnum
CREATE TYPE "ProductSectionType" AS ENUM ('products', 'categories', 'banner', 'mixed');

-- CreateEnum
CREATE TYPE "ProductSectionLayout" AS ENUM ('carousel', 'grid_2x2', 'single_grid', 'grid_3x1', 'hero', 'horizontal_scroll');

-- CreateTable
CREATE TABLE "ProductSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "type" "ProductSectionType" NOT NULL,
    "layout" "ProductSectionLayout" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSectionItem" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "productId" INTEGER,
    "categoryId" INTEGER,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSection_slug_key" ON "ProductSection"("slug");

-- CreateIndex
CREATE INDEX "ProductSection_active_idx" ON "ProductSection"("active");

-- CreateIndex
CREATE INDEX "ProductSection_position_idx" ON "ProductSection"("position");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSectionItem_sectionId_productId_key" ON "ProductSectionItem"("sectionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSectionItem_sectionId_categoryId_key" ON "ProductSectionItem"("sectionId", "categoryId");

-- AddForeignKey
ALTER TABLE "ProductSectionItem" ADD CONSTRAINT "ProductSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ProductSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSectionItem" ADD CONSTRAINT "ProductSectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSectionItem" ADD CONSTRAINT "ProductSectionItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

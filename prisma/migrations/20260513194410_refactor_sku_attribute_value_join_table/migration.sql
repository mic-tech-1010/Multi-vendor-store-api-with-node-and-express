/*
  Warnings:

  - You are about to drop the `ProductSkuAttributeValue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductSkuAttributeValue" DROP CONSTRAINT "ProductSkuAttributeValue_productAttributeValueId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSkuAttributeValue" DROP CONSTRAINT "ProductSkuAttributeValue_productSkuId_fkey";

-- DropTable
DROP TABLE "ProductSkuAttributeValue";

-- CreateTable
CREATE TABLE "_ProductAttributeValueToProductSku" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductAttributeValueToProductSku_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductAttributeValueToProductSku_B_index" ON "_ProductAttributeValueToProductSku"("B");

-- AddForeignKey
ALTER TABLE "_ProductAttributeValueToProductSku" ADD CONSTRAINT "_ProductAttributeValueToProductSku_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductAttributeValueToProductSku" ADD CONSTRAINT "_ProductAttributeValueToProductSku_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductSku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

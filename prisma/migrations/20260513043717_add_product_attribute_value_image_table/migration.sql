-- CreateTable
CREATE TABLE "ProductAttributeValueImage" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageCldPubId" TEXT NOT NULL,
    "imageAltText" TEXT NOT NULL,
    "productAttributeValueId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeValueImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductAttributeValueImage" ADD CONSTRAINT "ProductAttributeValueImage_productAttributeValueId_fkey" FOREIGN KEY ("productAttributeValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

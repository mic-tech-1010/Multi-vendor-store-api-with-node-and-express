/*
  Warnings:

  - A unique constraint covering the columns `[name,departmentId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_departmentId_key" ON "Category"("name", "departmentId");

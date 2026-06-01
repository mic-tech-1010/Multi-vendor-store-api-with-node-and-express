/*
  Warnings:

  - A unique constraint covering the columns `[position]` on the table `HomePageSection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "HomePageSection" ADD COLUMN     "groupId" INTEGER;

-- CreateTable
CREATE TABLE "HomePageSectionGroup" (
    "id" SERIAL NOT NULL,
    "isFullWidth" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageSectionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePageSection_position_key" ON "HomePageSection"("position");

-- AddForeignKey
ALTER TABLE "HomePageSection" ADD CONSTRAINT "HomePageSection_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HomePageSectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

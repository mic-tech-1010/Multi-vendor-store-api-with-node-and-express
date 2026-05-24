/*
  Warnings:

  - A unique constraint covering the columns `[sectionId,position]` on the table `HomePageSectionItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HomePageSectionItem_sectionId_position_key" ON "HomePageSectionItem"("sectionId", "position");

/*
  Warnings:

  - A unique constraint covering the columns `[ShortUrl]` on the table `Urls` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ShortUrl` on table `Urls` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Urls" ALTER COLUMN "ShortUrl" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Urls_ShortUrl_key" ON "Urls"("ShortUrl");

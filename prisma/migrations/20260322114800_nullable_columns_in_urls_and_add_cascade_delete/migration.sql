/*
  Warnings:

  - A unique constraint covering the columns `[UrlId]` on the table `ClickLogs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ClickLogs" DROP CONSTRAINT "ClickLogs_UrlId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_UrlId_fkey";

-- DropForeignKey
ALTER TABLE "Urls" DROP CONSTRAINT "Urls_UserId_fkey";

-- AlterTable
ALTER TABLE "Urls" ALTER COLUMN "ShortUrl" DROP NOT NULL,
ALTER COLUMN "IsActive" DROP NOT NULL,
ALTER COLUMN "Clicks" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClickLogs_UrlId_key" ON "ClickLogs"("UrlId");

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_UrlId_fkey" FOREIGN KEY ("UrlId") REFERENCES "Urls"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickLogs" ADD CONSTRAINT "ClickLogs_UrlId_fkey" FOREIGN KEY ("UrlId") REFERENCES "Urls"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `PreviousLongUrl` on table `History` required. This step will fail if there are existing NULL values in that column.
  - Made the column `PreviousShortUrl` on table `History` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "History" ALTER COLUMN "PreviousLongUrl" DROP NOT NULL,
ALTER COLUMN "PreviousShortUrl" DROP NOT NULL;

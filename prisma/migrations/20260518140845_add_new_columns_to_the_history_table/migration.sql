/*
  Warnings:

  - Added the required column `PreviousShortUrl` to the `History` table without a default value. This is not possible if the table is not empty.
  - Made the column `PreviousLongUrl` on table `History` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "History" ADD COLUMN     "NewShortUrl" TEXT,
ADD COLUMN     "PreviousShortUrl" TEXT,
ALTER COLUMN "PreviousLongUrl" DROP NOT NULL,
ALTER COLUMN "NewLongUrl" DROP NOT NULL;

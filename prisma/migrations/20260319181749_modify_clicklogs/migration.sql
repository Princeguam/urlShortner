/*
  Warnings:

  - You are about to drop the column `Clicks` on the `Urls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClickLogs" ADD COLUMN     "Clicks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Urls" DROP COLUMN "Clicks";

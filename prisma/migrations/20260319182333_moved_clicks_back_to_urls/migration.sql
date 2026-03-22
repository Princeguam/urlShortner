/*
  Warnings:

  - You are about to drop the column `Clicks` on the `ClickLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClickLogs" DROP COLUMN "Clicks";

-- AlterTable
ALTER TABLE "Urls" ADD COLUMN     "Clicks" INTEGER NOT NULL DEFAULT 0;

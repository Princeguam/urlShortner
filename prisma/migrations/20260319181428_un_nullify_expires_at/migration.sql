/*
  Warnings:

  - Made the column `ExpiresAt` on table `Urls` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Urls" ALTER COLUMN "ExpiresAt" SET NOT NULL;

/*
  Warnings:

  - Made the column `CustomSlug` on table `Plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Analytics` on table `Plan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "CustomSlug" SET NOT NULL,
ALTER COLUMN "Analytics" SET NOT NULL;

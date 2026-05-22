/*
  Warnings:

  - The `CustomSlug` column on the `Plan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "CustomSlug",
ADD COLUMN     "CustomSlug" INTEGER;

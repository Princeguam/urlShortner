/*
  Warnings:

  - You are about to drop the column `isActive` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "isActive",
ADD COLUMN     "IsActive" BOOLEAN NOT NULL DEFAULT true;

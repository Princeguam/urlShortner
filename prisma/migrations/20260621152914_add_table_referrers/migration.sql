/*
  Warnings:

  - You are about to drop the column `Referrer` on the `ClickLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClickLogs" DROP COLUMN "Referrer",
ADD COLUMN     "ReferrerId" INTEGER;

-- CreateTable
CREATE TABLE "Referrers" (
    "Id" SERIAL NOT NULL,
    "Domain" TEXT NOT NULL,

    CONSTRAINT "Referrers_pkey" PRIMARY KEY ("Id")
);

-- AddForeignKey
ALTER TABLE "ClickLogs" ADD CONSTRAINT "ClickLogs_ReferrerId_fkey" FOREIGN KEY ("ReferrerId") REFERENCES "Referrers"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

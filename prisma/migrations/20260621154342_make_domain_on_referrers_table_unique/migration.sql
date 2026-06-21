/*
  Warnings:

  - A unique constraint covering the columns `[Domain]` on the table `Referrers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Referrers_Domain_key" ON "Referrers"("Domain");

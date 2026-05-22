/*
  Warnings:

  - A unique constraint covering the columns `[UserId,Type]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserToken_UserId_Type_key" ON "UserToken"("UserId", "Type");

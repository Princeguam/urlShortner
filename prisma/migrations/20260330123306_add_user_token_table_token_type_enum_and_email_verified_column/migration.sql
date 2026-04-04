-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EmailVerification', 'PasswordReset');

-- AlterTable
ALTER TABLE "History" ALTER COLUMN "Action" SET DEFAULT 'UPDATE';

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "EmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserToken" (
    "Id" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Token" TEXT NOT NULL,
    "Type" "TokenType" NOT NULL,
    "UsedAt" TIMESTAMP(3),
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_Token_key" ON "UserToken"("Token");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

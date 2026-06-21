-- AlterTable
ALTER TABLE "ClickLogs" ADD COLUMN     "CickedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "IsDeleted" BOOLEAN NOT NULL DEFAULT false;

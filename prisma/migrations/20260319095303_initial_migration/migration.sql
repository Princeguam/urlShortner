-- CreateEnum
CREATE TYPE "ChangeAction" AS ENUM ('CREATE', 'UPDATE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "Users" (
    "Id" SERIAL NOT NULL,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Role" "Role" NOT NULL DEFAULT 'USER',
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "Id" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "RefreshToken" TEXT NOT NULL,
    "Expiration" TIMESTAMP(3) NOT NULL,
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSessions_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Urls" (
    "Id" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "LongUrl" TEXT NOT NULL,
    "ShortUrl" TEXT NOT NULL,
    "Clicks" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL,
    "ExpiresAt" TIMESTAMP(3),
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Urls_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "History" (
    "Id" SERIAL NOT NULL,
    "ChangedById" INTEGER NOT NULL,
    "UrlId" INTEGER NOT NULL,
    "Action" "ChangeAction" NOT NULL,
    "PreviousLongUrl" TEXT,
    "NewLongUrl" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ClickLogs" (
    "Id" SERIAL NOT NULL,
    "UrlId" INTEGER NOT NULL,
    "IpAddress" TEXT,
    "UserAgent" TEXT,
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickLogs_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "Users_Username_Email_idx" ON "Users"("Username", "Email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_Password_key" ON "Users"("Email", "Password");

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Urls" ADD CONSTRAINT "Urls_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_ChangedById_fkey" FOREIGN KEY ("ChangedById") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_UrlId_fkey" FOREIGN KEY ("UrlId") REFERENCES "Urls"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickLogs" ADD CONSTRAINT "ClickLogs_UrlId_fkey" FOREIGN KEY ("UrlId") REFERENCES "Urls"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

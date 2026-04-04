-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('Free', 'Basic', 'Pro');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('Monthly', 'Annually');

-- CreateTable
CREATE TABLE "Plan" (
    "Id" TEXT NOT NULL,
    "Name" "PlanType" NOT NULL,
    "Price" DECIMAL(65,30) NOT NULL,
    "AnnualPrice" DECIMAL(65,30),
    "MaxUrls" INTEGER,
    "MaxClicks" INTEGER,
    "CustomSlug" BOOLEAN DEFAULT false,
    "Analytics" BOOLEAN NOT NULL DEFAULT false,
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "Id" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "PlanId" TEXT NOT NULL,
    "BillingCycle" "BillingCycle" NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT false,
    "StartDate" TIMESTAMP(3),
    "EndDate" TIMESTAMP(3),
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "Id" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL,
    "SubscriptionId" TEXT NOT NULL,
    "Amount" DECIMAL(65,30) NOT NULL,
    "Currency" TEXT NOT NULL DEFAULT 'NGN',
    "Status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "Reference" TEXT NOT NULL,
    "Description" TEXT,
    "PaystackRef" TEXT,
    "PaystackChannel" TEXT,
    "PaidAt" TIMESTAMP(3),
    "Created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_Name_key" ON "Plan"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_Reference_key" ON "Payments"("Reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_PaystackRef_key" ON "Payments"("PaystackRef");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_PlanId_fkey" FOREIGN KEY ("PlanId") REFERENCES "Plan"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_SubscriptionId_fkey" FOREIGN KEY ("SubscriptionId") REFERENCES "Subscription"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[GatewaySubscriptionCode]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "GatewayCustomerCode" TEXT,
ADD COLUMN     "GatewaySubscriptionCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_GatewaySubscriptionCode_key" ON "Subscription"("GatewaySubscriptionCode");

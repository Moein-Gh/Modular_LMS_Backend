-- DropEnum
DROP TYPE "public"."Effect";

-- DropEnum
DROP TYPE "public"."Scope";

-- CreateTable
CREATE TABLE "public"."bank" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionFee" DECIMAL(18,4) NOT NULL,
    "commissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "defaultMaxInstallments" INTEGER NOT NULL DEFAULT 10,
    "installmentOptions" INTEGER[] DEFAULT ARRAY[5,10,12],
    "status" TEXT NOT NULL DEFAULT 'active',
    "currency" TEXT NOT NULL DEFAULT 'Toman',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accountId_key" ON "public"."bank"("accountId");

-- AddForeignKey
ALTER TABLE "public"."bank" ADD CONSTRAINT "bank_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

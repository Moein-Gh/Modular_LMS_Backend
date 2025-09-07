-- DropForeignKey
ALTER TABLE "public"."bank" DROP CONSTRAINT "bank_accountId_fkey";

-- AlterTable
ALTER TABLE "public"."bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12],
ALTER COLUMN "accountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."bank" ADD CONSTRAINT "bank_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

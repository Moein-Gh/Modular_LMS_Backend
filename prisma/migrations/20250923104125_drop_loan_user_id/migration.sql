/*
  Warnings:

  - You are about to drop the column `userId` on the `Loan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Loan" DROP CONSTRAINT "Loan_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Loan" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12];

-- CreateEnum
CREATE TYPE "public"."InstallmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAID');

-- AlterTable
ALTER TABLE "public"."bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12];

-- CreateTable
CREATE TABLE "public"."Installment" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Installment" ADD CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

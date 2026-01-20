-- CreateEnum
CREATE TYPE "LoanRequestStatus" AS ENUM ('PENDING', 'IN_QUEUE', 'APPROVED', 'REJECTED', 'CONVERTED');

-- AlterTable
ALTER TABLE "bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12];

-- CreateTable
CREATE TABLE "loan_request" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "accountId" UUID NOT NULL,
    "loanTypeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "paymentMonths" INTEGER NOT NULL,
    "status" "LoanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "owner_id" UUID,
    "created_by" UUID,

    CONSTRAINT "loan_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_queue" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "loanRequestId" UUID NOT NULL,
    "queueOrder" INTEGER NOT NULL,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "loan_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_request_code_key" ON "loan_request"("code");

-- CreateIndex
CREATE INDEX "loan_request_is_deleted_idx" ON "loan_request"("is_deleted");

-- CreateIndex
CREATE INDEX "loan_request_status_idx" ON "loan_request"("status");

-- CreateIndex
CREATE INDEX "loan_request_owner_id_idx" ON "loan_request"("owner_id");

-- CreateIndex
CREATE INDEX "loan_request_created_by_idx" ON "loan_request"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "loan_queue_code_key" ON "loan_queue"("code");

-- CreateIndex
CREATE UNIQUE INDEX "loan_queue_loanRequestId_key" ON "loan_queue"("loanRequestId");

-- CreateIndex
CREATE INDEX "loan_queue_order_idx" ON "loan_queue"("queueOrder");

-- CreateIndex
CREATE INDEX "loan_queue_is_deleted_idx" ON "loan_queue"("is_deleted");

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "LoanType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_queue" ADD CONSTRAINT "loan_queue_loanRequestId_fkey" FOREIGN KEY ("loanRequestId") REFERENCES "loan_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

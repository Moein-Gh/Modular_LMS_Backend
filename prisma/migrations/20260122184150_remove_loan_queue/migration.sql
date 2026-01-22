-- CreateTable: Backup loan_queue data before dropping
-- This preserves the data in a backup table for future reference
CREATE TABLE IF NOT EXISTS loan_queue_backup AS
SELECT *
FROM loan_queue;
-- AlterEnum: Remove IN_QUEUE from LoanRequestStatus
-- First, update any existing IN_QUEUE status to PENDING
UPDATE loan_request
SET status = 'PENDING'
WHERE status = 'IN_QUEUE';
-- Drop the old enum and recreate without IN_QUEUE
-- Step 1: Drop the default temporarily
ALTER TABLE "loan_request"
ALTER COLUMN "status" DROP DEFAULT;
-- Step 2: Rename old enum
ALTER TYPE "LoanRequestStatus"
RENAME TO "LoanRequestStatus_old";
-- Step 3: Create new enum without IN_QUEUE
CREATE TYPE "LoanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED');
-- Step 4: Alter column to use new enum
ALTER TABLE "loan_request"
ALTER COLUMN "status" TYPE "LoanRequestStatus" USING ("status"::text::"LoanRequestStatus");
-- Step 5: Restore the default
ALTER TABLE "loan_request"
ALTER COLUMN "status"
SET DEFAULT 'PENDING'::"LoanRequestStatus";
-- Step 6: Drop old enum
DROP TYPE "LoanRequestStatus_old";
-- DropTable: loan_queue
-- Data is already backed up in loan_queue_backup table
DROP TABLE "loan_queue";
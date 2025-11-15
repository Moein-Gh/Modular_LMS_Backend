-- Alter foreign key on Journal.transactionId to ON DELETE SET NULL
ALTER TABLE "Journal" DROP CONSTRAINT IF EXISTS "Journal_transactionId_fkey";
ALTER TABLE "Journal"
ADD CONSTRAINT "Journal_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
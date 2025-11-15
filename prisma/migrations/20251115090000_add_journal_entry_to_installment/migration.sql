-- AlterTable
ALTER TABLE "Installment"
ADD COLUMN "journalEntryId" UUID;
-- AddForeignKey
ALTER TABLE "Installment"
ADD CONSTRAINT "Installment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AlterTable
ALTER TABLE "SubscriptionFee"
ADD COLUMN "journalEntryId" UUID;
-- AddForeignKey
ALTER TABLE "SubscriptionFee"
ADD CONSTRAINT "SubscriptionFee_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
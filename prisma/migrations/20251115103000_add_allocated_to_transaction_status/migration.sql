-- Add new enum value ALLOCATED to TransactionStatus
ALTER TYPE "TransactionStatus"
ADD VALUE IF NOT EXISTS 'ALLOCATED';
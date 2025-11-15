-- Add new enum value ALLOCATED to InstallmentStatus and SubscriptionFeeStatus
-- This matches the updated Prisma schema where both enums include ALLOCATED.
-- Safe additive change; uses IF NOT EXISTS for idempotency.
ALTER TYPE "InstallmentStatus"
ADD VALUE IF NOT EXISTS 'ALLOCATED';
ALTER TYPE "SubscriptionFeeStatus"
ADD VALUE IF NOT EXISTS 'ALLOCATED';
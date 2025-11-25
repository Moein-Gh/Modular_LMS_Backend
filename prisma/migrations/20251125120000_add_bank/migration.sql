-- Migration: add_bank
-- Creates the `bank` table used by the application seed
CREATE TABLE IF NOT EXISTS public.bank (
    "id" uuid PRIMARY KEY,
    "name" text NOT NULL,
    "subscriptionFee" numeric(18, 4) NOT NULL,
    "commissionPercentage" numeric(5, 2) NOT NULL DEFAULT 10,
    "defaultMaxInstallments" integer NOT NULL DEFAULT 10,
    "installmentOptions" integer [] NOT NULL DEFAULT ARRAY [5,10,12],
    "status" text NOT NULL DEFAULT 'active',
    "currency" text NOT NULL DEFAULT 'Toman',
    "timeZone" text NOT NULL DEFAULT 'Asia/Tehran',
    "accountId" uuid UNIQUE,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);
-- Optionally add FK to account if that table exists. This is left as a nullable FK.
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'account'
) THEN -- Add the constraint only if it does not already exist. Postgres does not support
-- `ADD CONSTRAINT IF NOT EXISTS`, so check pg_constraint and use dynamic SQL.
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'bank_account_fk'
        AND n.nspname = 'public'
) THEN EXECUTE 'ALTER TABLE public.bank ADD CONSTRAINT bank_account_fk FOREIGN KEY ("accountId") REFERENCES public.account(id) ON DELETE SET NULL';
END IF;
END IF;
END $$;
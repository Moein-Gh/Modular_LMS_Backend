-- Migration: add_transactionkind_inter_account
-- Safely add the new enum value to the PostgreSQL enum type backing Prisma's `TransactionKind`.
-- Migration: update TransactionKind enum
-- Creates a new enum type with the desired set of labels, migrates any
-- columns using the old enum to the new enum, drops the old enum type,
-- then renames the new enum to the original name. This is the safe way
-- to remove enum labels in PostgreSQL.
DO $$
DECLARE rec record;
BEGIN -- Create new enum type with the final desired labels
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TransactionKind_new'
) THEN CREATE TYPE "TransactionKind_new" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'LOAN_DISBURSEMENT',
    'TRANSFER'
);
END IF;
-- If the original enum exists, migrate columns that use it to the new type
IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TransactionKind'
) THEN FOR rec IN
SELECT n.nspname AS schema_name,
    c.relname AS table_name,
    a.attname AS column_name
FROM pg_type t
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.typname = 'TransactionKind' LOOP EXECUTE format(
        'ALTER TABLE %I.%I ALTER COLUMN %I TYPE "TransactionKind_new" USING %I::text::"TransactionKind_new"',
        rec.schema_name,
        rec.table_name,
        rec.column_name,
        rec.column_name
    );
END LOOP;
-- Drop the old enum and rename the new enum to the original name
DROP TYPE "TransactionKind";
ALTER TYPE "TransactionKind_new"
RENAME TO "TransactionKind";
ELSE -- If original enum doesn't exist yet, just rename the new enum
ALTER TYPE "TransactionKind_new"
RENAME TO "TransactionKind";
END IF;
END $$;
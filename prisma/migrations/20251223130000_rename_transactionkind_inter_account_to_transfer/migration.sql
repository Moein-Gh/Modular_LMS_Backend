-- Migration: rename TransactionKind value TRANSFER -> TRANSFER
-- Safely replace enum labels for PostgreSQL-backed Prisma enum TransactionKind
DO $$
DECLARE rec record;
BEGIN -- Create new enum type with desired labels
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
-- AlterTable: identity
ALTER TABLE "public"."identity" DROP COLUMN IF EXISTS "first_name",
    DROP COLUMN IF EXISTS "last_name",
    DROP COLUMN IF EXISTS "avatar_url",
    DROP COLUMN IF EXISTS "phone_verified_at",
    ADD COLUMN IF NOT EXISTS "name" TEXT,
    ADD COLUMN IF NOT EXISTS "country_code" TEXT,
    ADD COLUMN IF NOT EXISTS "national_code" TEXT;
-- No data backfill provided here; perform manual backfill if required.
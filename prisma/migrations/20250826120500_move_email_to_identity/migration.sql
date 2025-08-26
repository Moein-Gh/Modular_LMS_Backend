-- Move email from User to Identity
ALTER TABLE "public"."User" DROP COLUMN IF EXISTS "email";
ALTER TABLE "public"."identity"
ADD COLUMN IF NOT EXISTS "email" TEXT;
-- Unique index for identity.email (nullable unique handled by partial index to avoid multiple NULLs if desired)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname = 'identity_email_key'
) THEN CREATE UNIQUE INDEX "identity_email_key" ON "public"."identity"("email");
END IF;
END $$;
-- CreateTable: identity
CREATE TABLE IF NOT EXISTS "public"."identity" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "phone_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "identity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "identity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "identity_user_id_key" ON "public"."identity"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "identity_phone_key" ON "public"."identity"("phone");
-- CreateTable: refresh_token
CREATE TABLE IF NOT EXISTS "public"."refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token_id" UUID,
    "user_agent" TEXT,
    "ip_address" TEXT,
    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_token_user_hash_unique" ON "public"."refresh_token"("user_id", "token_hash");
CREATE INDEX IF NOT EXISTS "refresh_token_user_idx" ON "public"."refresh_token"("user_id");
-- CreateTable: sms_code
CREATE TABLE IF NOT EXISTS "public"."sms_code" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_code_pkey" PRIMARY KEY ("id")
);
-- Indexes for sms_code
CREATE INDEX IF NOT EXISTS "sms_code_phone_idx" ON "public"."sms_code"("phone");
CREATE INDEX IF NOT EXISTS "sms_code_phone_code_idx" ON "public"."sms_code"("phone", "code");
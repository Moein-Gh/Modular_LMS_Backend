-- Add rendered_content column to message_recipient
ALTER TABLE "message_recipient"
ADD COLUMN "rendered_content" TEXT;
-- Add phone number for web-login (replaces User ID / UUID login)
-- Nullable for existing users who must set phone via LINE app first.

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone IS NOT NULL;

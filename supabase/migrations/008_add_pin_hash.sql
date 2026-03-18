-- Add web-login PIN hash to users table
-- Allows users to log in from external browsers using LINE UID + 6-digit PIN

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;

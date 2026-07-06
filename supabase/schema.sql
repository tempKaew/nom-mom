-- Nom Mom – Baby tracking app schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor to create tables.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (linked to LINE via line_user_id after LIFF login)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT UNIQUE,
  phone TEXT,
  display_name TEXT,
  picture_url TEXT,
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone IS NOT NULL;

-- Babies (created_by_user_id = ผู้สร้างข้อมูลเด็ก, มีสิทธิสร้างรหัสเชิญ)
CREATE TABLE IF NOT EXISTS babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  birth_date DATE,
  avatar_url TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Baby members (many-to-many: users <-> babies with role)
CREATE TABLE IF NOT EXISTS baby_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(baby_id, user_id)
);

-- Milk logs (breast/bottle, amount or duration)
CREATE TABLE IF NOT EXISTS milk_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_ml INTEGER,
  duration_minutes INTEGER,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Invites to add another user to a baby (label = ใส่ label ว่าคนที่ส่งไปเชิญคือใคร เช่น ป้า แม่)
CREATE TABLE IF NOT EXISTS baby_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_line_user_id TEXT,
  invitee_email TEXT,
  label TEXT,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_baby_members_baby_id ON baby_members(baby_id);
CREATE INDEX IF NOT EXISTS idx_baby_members_user_id ON baby_members(user_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_baby_id ON milk_logs(baby_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_logged_at ON milk_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_baby_invites_token ON baby_invites(token);
CREATE INDEX IF NOT EXISTS idx_baby_invites_baby_id ON baby_invites(baby_id);

-- Optional: updated_at trigger helper (run once per table if desired)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Example: trigger on users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER babies_updated_at
  BEFORE UPDATE ON babies
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER baby_members_updated_at
  BEFORE UPDATE ON baby_members
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER milk_logs_updated_at
  BEFORE UPDATE ON milk_logs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


CREATE TRIGGER baby_invites_updated_at
  BEFORE UPDATE ON baby_invites
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

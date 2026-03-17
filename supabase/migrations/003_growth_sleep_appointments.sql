-- Migration 003: Growth records, sleep logs, appointments, diaper method column
-- Run in Supabase SQL Editor

-- ─── Growth Records ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS growth_records (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id                UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg              NUMERIC(6,3),          -- e.g. 3.500
  height_cm              NUMERIC(6,1),          -- e.g. 52.5
  head_circumference_cm  NUMERIC(5,1),          -- e.g. 34.5
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_records_baby_id    ON growth_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_recorded_at ON growth_records(recorded_at);

CREATE TRIGGER growth_records_updated_at
  BEFORE UPDATE ON growth_records
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── Sleep Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id          UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,         -- can be set manually or computed from started/ended
  type             TEXT NOT NULL DEFAULT 'nap',  -- nap | night
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_baby_id    ON sleep_logs(baby_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_started_at ON sleep_logs(started_at);

CREATE TRIGGER sleep_logs_updated_at
  BEFORE UPDATE ON sleep_logs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── Appointments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id          UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  doctor_name      TEXT,
  hospital         TEXT,
  appointment_at   TIMESTAMPTZ NOT NULL,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'upcoming',  -- upcoming | completed | cancelled
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_baby_id        ON appointments(baby_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_at ON appointments(appointment_at);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── Diaper logs: add method column ──────────────────────────────────────────
-- method: 'diaper' (for infants) | 'toilet' (for toddlers/older children)
-- Existing rows default to 'diaper' automatically.
ALTER TABLE diaper_logs
  ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'diaper';

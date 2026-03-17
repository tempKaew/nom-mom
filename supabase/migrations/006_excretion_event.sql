-- ============================================================
-- Migration 006: excretion_event
-- Replaces diaper_logs as the single source of truth for all
-- excretion tracking (pee, poop, both).
-- ============================================================

-- 1. Create new table
CREATE TABLE IF NOT EXISTS excretion_event (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id       UUID        NOT NULL,
  user_id       UUID,

  type          TEXT        NOT NULL CHECK (type IN ('pee', 'poop', 'both')),
  datetime      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  diaper_used   BOOLEAN     NOT NULL DEFAULT TRUE,

  -- pee details
  pee_amount    TEXT        CHECK (pee_amount    IN ('small', 'medium', 'large')),
  pee_color     TEXT        CHECK (pee_color     IN ('clear', 'light_yellow', 'dark_yellow')),

  -- poop details
  poop_color    TEXT        CHECK (poop_color    IN ('yellow', 'green', 'brown', 'black', 'pale')),
  poop_texture  TEXT        CHECK (poop_texture  IN ('watery', 'soft', 'normal', 'hard', 'mucus')),
  poop_amount   TEXT        CHECK (poop_amount   IN ('small', 'medium', 'large')),

  -- shared
  smell         TEXT        CHECK (smell         IN ('normal', 'strong', 'unusual')),
  rash          BOOLEAN,
  leak          BOOLEAN,
  note          TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_excretion_event_baby_id  ON excretion_event (baby_id);
CREATE INDEX IF NOT EXISTS idx_excretion_event_datetime ON excretion_event (datetime DESC);

-- 3. Migrate existing diaper_logs → excretion_event
--    Maps:  diaper_logs.type (pee/poo/both) → excretion_event.type (pee/poop/both)
--    Note: old UI used "poo"; new system uses "poop".
INSERT INTO excretion_event (baby_id, user_id, type, datetime, diaper_used, created_at)
SELECT
  baby_id,
  user_id,
  CASE type
    WHEN 'poo'  THEN 'poop'
    WHEN 'both' THEN 'both'
    ELSE 'pee'
  END,
  COALESCE(logged_at, created_at, NOW()),
  TRUE,
  COALESCE(created_at, NOW())
FROM diaper_logs
ON CONFLICT DO NOTHING;

-- 4. Mark diaper_logs as deprecated
COMMENT ON TABLE diaper_logs IS
  'DEPRECATED — superseded by excretion_event. Kept for backward compatibility. Do NOT write new rows here.';

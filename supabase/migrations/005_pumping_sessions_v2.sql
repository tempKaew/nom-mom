-- Pumping sessions v2: add pumping type, breast status, storage, note tags

ALTER TABLE pumping_sessions
  ADD COLUMN IF NOT EXISTS pumping_type     TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS breast_condition TEXT,
  ADD COLUMN IF NOT EXISTS pain_level       TEXT,
  ADD COLUMN IF NOT EXISTS storage_type     TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS note_text        TEXT,
  ADD COLUMN IF NOT EXISTS note_tags        TEXT[] NOT NULL DEFAULT '{}';

-- Rename old notes column → keep it for backward compat but new inserts use note_text
-- (existing rows retain notes value as-is)

COMMENT ON COLUMN pumping_sessions.pumping_type     IS 'normal | power | relieve';
COMMENT ON COLUMN pumping_sessions.breast_condition IS 'engorged | normal | soft';
COMMENT ON COLUMN pumping_sessions.pain_level       IS 'painful | no_pain';
COMMENT ON COLUMN pumping_sessions.storage_type     IS 'immediate | room_temp | frozen';
COMMENT ON COLUMN pumping_sessions.note_tags        IS 'preset tag array, e.g. {painful,low_yield}';

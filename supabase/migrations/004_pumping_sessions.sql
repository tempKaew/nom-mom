-- Pumping sessions: detailed breast pumping tracker
-- Separate from milk_logs to support left/right split volumes + precise start/end times

CREATE TABLE IF NOT EXISTS pumping_sessions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id          UUID        NOT NULL REFERENCES babies(id)  ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time         TIMESTAMPTZ,
  duration_minutes INTEGER,
  left_volume_ml   NUMERIC(8,2) NOT NULL DEFAULT 0,
  right_volume_ml  NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_volume_ml  NUMERIC(8,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pumping_sessions_baby_id
  ON pumping_sessions (baby_id, start_time DESC);

ALTER TABLE pumping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read pumping sessions"
  ON pumping_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM baby_members
      WHERE baby_members.baby_id = pumping_sessions.baby_id
        AND baby_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert pumping sessions"
  ON pumping_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM baby_members
      WHERE baby_members.baby_id = pumping_sessions.baby_id
        AND baby_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update pumping sessions"
  ON pumping_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Owner can delete pumping sessions"
  ON pumping_sessions FOR DELETE
  USING (user_id = auth.uid());

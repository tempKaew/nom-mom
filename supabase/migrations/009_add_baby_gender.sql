ALTER TABLE babies
ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'babies_gender_check'
  ) THEN
    ALTER TABLE babies
    ADD CONSTRAINT babies_gender_check
    CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'unknown'));
  END IF;
END $$;


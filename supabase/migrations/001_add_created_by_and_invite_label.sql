-- Run this if you already have the tables and need to add new columns only.

-- Babies: who created this baby (only they can create invite codes)
ALTER TABLE babies ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Babies: avatar image URL (รูปโปรไฟล์เด็ก)
ALTER TABLE babies ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Baby invites: label for who we're inviting (e.g. ป้า, พ่อ, แม่)
ALTER TABLE baby_invites ADD COLUMN IF NOT EXISTS label TEXT;

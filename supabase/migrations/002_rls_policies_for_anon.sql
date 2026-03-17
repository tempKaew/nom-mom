-- Allow API (anon key) to read/write data. Run this if GET /api/me returns empty babies
-- despite baby_members and babies having rows (often due to RLS blocking anon).

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_users_all" ON users;
CREATE POLICY "anon_users_all" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Babies
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_babies_all" ON babies;
CREATE POLICY "anon_babies_all" ON babies FOR ALL TO anon USING (true) WITH CHECK (true);

-- Baby members
ALTER TABLE baby_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_baby_members_all" ON baby_members;
CREATE POLICY "anon_baby_members_all" ON baby_members FOR ALL TO anon USING (true) WITH CHECK (true);

-- Baby invites
ALTER TABLE baby_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_baby_invites_all" ON baby_invites;
CREATE POLICY "anon_baby_invites_all" ON baby_invites FOR ALL TO anon USING (true) WITH CHECK (true);

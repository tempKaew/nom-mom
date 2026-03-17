-- ============================================================
-- Migration 007: Drop diaper_logs
-- All data has been migrated to excretion_event in migration 006.
-- This migration permanently removes the legacy table.
-- ============================================================

-- 1. Drop trigger
DROP TRIGGER IF EXISTS diaper_logs_updated_at ON diaper_logs;

-- 2. Drop indexes (dropped automatically with the table, listed here for clarity)
DROP INDEX IF EXISTS idx_diaper_logs_baby_id;
DROP INDEX IF EXISTS idx_diaper_logs_logged_at;

-- 3. Drop table (CASCADE removes any remaining constraints/references)
DROP TABLE IF EXISTS diaper_logs CASCADE;

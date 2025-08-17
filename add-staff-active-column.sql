-- Migration to add active column to staff table
-- This allows soft deletion (deactivation) instead of hard deletion

-- Add active column with default true
ALTER TABLE staff ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Set all existing staff as active
UPDATE staff SET active = true WHERE active IS NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN staff.active IS 'Staff account status - false means deactivated (soft deleted)';

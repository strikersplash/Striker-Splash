-- Add child registration support to players table
-- Migration: Add is_child_account column

ALTER TABLE players ADD COLUMN is_child_account BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN parent_phone VARCHAR(20);

-- Add comments for clarity
COMMENT ON COLUMN players.is_child_account IS 'Indicates if this account was registered by a parent for their child';
COMMENT ON COLUMN players.parent_phone IS 'The actual parent phone number when is_child_account is true';

-- Update existing records (assume they are not child accounts unless phone format suggests otherwise)
UPDATE players SET is_child_account = FALSE WHERE is_child_account IS NULL;

-- Identify existing child accounts by phone format (contains -C pattern)
UPDATE players 
SET is_child_account = TRUE, 
    parent_phone = REGEXP_REPLACE(phone, '-C\d+$', '')
WHERE phone ~ '-C\d+$';

-- Add consecutive_kicks column to game_stats table
-- This column tracks consecutive kicks made by a player (minimum 3, maximum 5)
-- NULL means consecutive kicks were not tracked for this game

ALTER TABLE game_stats ADD COLUMN consecutive_kicks INTEGER;

-- Add a check constraint to ensure consecutive_kicks is between 3 and 5 when not null
ALTER TABLE game_stats ADD CONSTRAINT chk_consecutive_kicks 
  CHECK (consecutive_kicks IS NULL OR (consecutive_kicks >= 3 AND consecutive_kicks <= 5));

-- Add a comment to the column
COMMENT ON COLUMN game_stats.consecutive_kicks IS 'Number of consecutive kicks made by player (3-5 only, NULL if not tracked)';

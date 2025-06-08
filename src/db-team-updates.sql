-- Add team play and session tracking to game_stats
ALTER TABLE game_stats ADD COLUMN IF NOT EXISTS team_play BOOLEAN DEFAULT FALSE;
ALTER TABLE game_stats ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;
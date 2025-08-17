-- Add competition_id column to team_stats table
ALTER TABLE team_stats ADD COLUMN competition_id INTEGER;

-- Update existing records to use NULL for competition_id (or set a default if you know it)
UPDATE team_stats SET competition_id = NULL;

-- Add a foreign key constraint if needed
ALTER TABLE team_stats ADD CONSTRAINT fk_team_stats_competition
    FOREIGN KEY (competition_id) 
    REFERENCES custom_competitions(id)
    ON DELETE SET NULL;

-- Add unique constraint for team_id and competition_id combination
-- This allows for proper ON CONFLICT handling in INSERT queries
ALTER TABLE team_stats ADD CONSTRAINT unique_team_competition 
    UNIQUE (team_id, competition_id);

-- Add competition_id column to team_stats table using a different approach
-- First check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_stats' AND column_name = 'competition_id'
    ) THEN
        -- Execute as superuser
        PERFORM dblink_exec('dbname=' || current_database(), 
                          'ALTER TABLE team_stats ADD COLUMN competition_id INTEGER');
        PERFORM dblink_exec('dbname=' || current_database(), 
                          'ALTER TABLE team_stats ADD CONSTRAINT fk_team_stats_competition FOREIGN KEY (competition_id) REFERENCES custom_competitions(id) ON DELETE SET NULL');
    END IF;
END
$$;

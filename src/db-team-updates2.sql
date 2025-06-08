-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  staff_id INTEGER REFERENCES staff(id),
  kicks INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  team_play BOOLEAN DEFAULT FALSE
);

-- Add team_play column to queue_tickets table
ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS team_play BOOLEAN DEFAULT FALSE;

-- Create API endpoint for getting player team info
CREATE OR REPLACE FUNCTION get_player_team(player_id INTEGER)
RETURNS TABLE(
  team_id INTEGER,
  team_name VARCHAR(100),
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    COUNT(tm2.id) AS member_count
  FROM 
    team_members tm
  JOIN 
    teams t ON tm.team_id = t.id
  JOIN 
    team_members tm2 ON t.id = tm2.team_id
  WHERE 
    tm.player_id = player_id
  GROUP BY 
    t.id, t.name;
END;
$$ LANGUAGE plpgsql;
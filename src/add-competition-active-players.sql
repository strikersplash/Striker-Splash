-- Add active players table for team competitions
CREATE TABLE IF NOT EXISTS custom_competition_active_players (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES custom_competitions(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  goals INTEGER DEFAULT 0,
  kicks_taken INTEGER DEFAULT 0,
  selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (competition_id, team_id, player_id)
);

COMMENT ON TABLE custom_competition_active_players IS 'Stores the selected active players for 11+ player teams in competitions';
COMMENT ON COLUMN custom_competition_active_players.status IS 'Status can be: active, injured, benched, etc.';
COMMENT ON COLUMN custom_competition_active_players.goals IS 'Goals scored by this player in this competition';
COMMENT ON COLUMN custom_competition_active_players.kicks_taken IS 'Total kicks taken by this player in this competition';

-- Create index for faster lookups
CREATE INDEX idx_active_players_competition ON custom_competition_active_players(competition_id);
CREATE INDEX idx_active_players_team ON custom_competition_active_players(team_id);
CREATE INDEX idx_active_players_player ON custom_competition_active_players(player_id);

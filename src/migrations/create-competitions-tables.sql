-- Create competitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'individual' or 'team'
  team_size INTEGER,
  cost DECIMAL(10, 2) NOT NULL,
  kicks_per_player INTEGER NOT NULL,
  max_teams INTEGER,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create competition_teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS competition_teams (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create competition_players table if it doesn't exist
CREATE TABLE IF NOT EXISTS competition_players (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  team_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_competition_teams_comp_id ON competition_teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_teams_team_id ON competition_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_competition_players_comp_id ON competition_players(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_players_player_id ON competition_players(player_id);
CREATE INDEX IF NOT EXISTS idx_competition_players_team_id ON competition_players(team_id);

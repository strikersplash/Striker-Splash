-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logo_path VARCHAR(255)
);

-- Team memberships
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  player_id INTEGER REFERENCES players(id),
  is_captain BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, player_id)
);

-- Team stats (aggregated from player stats)
CREATE TABLE IF NOT EXISTS team_stats (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  total_goals INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player_id ON team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_team_id ON team_stats(team_id);
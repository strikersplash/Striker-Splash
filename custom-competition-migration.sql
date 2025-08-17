-- Custom Competition System Tables

-- Main competitions table
CREATE TABLE IF NOT EXISTS custom_competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'individual' or 'team'
  format VARCHAR(50), -- '1v1', '1v1v1', '1v1v1v1', 'solo' for individual
  team_size INTEGER, -- team size for team competitions (3, 5, 7, 11)
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  kicks_per_player INTEGER NOT NULL DEFAULT 5,
  max_participants INTEGER, -- for individual competitions
  max_teams INTEGER, -- for team competitions
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'cancelled'
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Individual competition participants
CREATE TABLE IF NOT EXISTS custom_competition_participants (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES custom_competitions(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id),
  goals INTEGER DEFAULT 0,
  kicks_taken INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'active', 'completed'
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, player_id)
);

-- Team competition participants
CREATE TABLE IF NOT EXISTS custom_competition_teams (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES custom_competitions(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id),
  total_goals INTEGER DEFAULT 0,
  total_kicks INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'active', 'completed'
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, team_id)
);

-- Competition activity log
CREATE TABLE IF NOT EXISTS custom_competition_activity (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES custom_competitions(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id), -- null for individual competitions
  goals INTEGER NOT NULL,
  kicks_used INTEGER NOT NULL,
  consecutive_kicks INTEGER, -- for tracking consecutive kicks streak
  notes TEXT,
  logged_by INTEGER REFERENCES staff(id),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_competitions_status ON custom_competitions(status);
CREATE INDEX IF NOT EXISTS idx_custom_competitions_type ON custom_competitions(type);
CREATE INDEX IF NOT EXISTS idx_custom_competitions_created_at ON custom_competitions(created_at);

CREATE INDEX IF NOT EXISTS idx_custom_competition_participants_competition ON custom_competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_custom_competition_participants_player ON custom_competition_participants(player_id);

CREATE INDEX IF NOT EXISTS idx_custom_competition_teams_competition ON custom_competition_teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_custom_competition_teams_team ON custom_competition_teams(team_id);

CREATE INDEX IF NOT EXISTS idx_custom_competition_activity_competition ON custom_competition_activity(competition_id);
CREATE INDEX IF NOT EXISTS idx_custom_competition_activity_logged_at ON custom_competition_activity(logged_at);

-- Add comments
COMMENT ON TABLE custom_competitions IS 'Staff-created custom competitions';
COMMENT ON TABLE custom_competition_participants IS 'Individual players participating in custom competitions';
COMMENT ON TABLE custom_competition_teams IS 'Teams participating in custom competitions';
COMMENT ON TABLE custom_competition_activity IS 'Log of all goals scored in custom competitions';

COMMENT ON COLUMN custom_competitions.type IS 'Competition type: individual or team';
COMMENT ON COLUMN custom_competitions.format IS 'Format for individual competitions: 1v1, 1v1v1, 1v1v1v1, solo';
COMMENT ON COLUMN custom_competitions.team_size IS 'Team size for team competitions: 3, 5, 7, 11';
COMMENT ON COLUMN custom_competitions.status IS 'Competition status: waiting, active, completed, cancelled';

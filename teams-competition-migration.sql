-- Teams & Competition Module Database Migration
-- This migration adds support for team vs team matches and solo competitions

-- Enhanced teams table (building on existing structure)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 11;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 11;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_recruiting BOOLEAN DEFAULT true;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Matches table for head-to-head team competitions
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('3v3', '5v5', '10v10', '11v11')),
  team_a_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  completed_at TIMESTAMP,
  location VARCHAR(100),
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solo competitions table for individual contests
CREATE TABLE IF NOT EXISTS solo_competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  max_participants INTEGER DEFAULT 50,
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  completed_at TIMESTAMP,
  location VARCHAR(100),
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match participants (links players to specific matches)
CREATE TABLE IF NOT EXISTS match_participants (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kicks_remaining INTEGER DEFAULT 5,
  total_kicks_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id)
);

-- Solo competition participants
CREATE TABLE IF NOT EXISTS solo_participants (
  id SERIAL PRIMARY KEY,
  solo_competition_id INTEGER NOT NULL REFERENCES solo_competitions(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kicks_remaining INTEGER DEFAULT 5,
  total_kicks_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(solo_competition_id, player_id)
);

-- Unified kick log table for all competition types
CREATE TABLE IF NOT EXISTS kick_log (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  
  -- Competition type and references
  competition_type VARCHAR(20) NOT NULL CHECK (competition_type IN ('match', 'solo')),
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  solo_competition_id INTEGER REFERENCES solo_competitions(id) ON DELETE CASCADE,
  
  -- Kick details
  goals INTEGER NOT NULL DEFAULT 0,
  kicks_used INTEGER NOT NULL DEFAULT 1,
  location VARCHAR(100),
  
  -- Team context (for matches)
  team_id INTEGER REFERENCES teams(id),
  
  -- Additional tracking
  consecutive_kicks INTEGER,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure proper competition type linking
  CONSTRAINT chk_competition_reference CHECK (
    (competition_type = 'match' AND match_id IS NOT NULL AND solo_competition_id IS NULL) OR
    (competition_type = 'solo' AND solo_competition_id IS NOT NULL AND match_id IS NULL)
  )
);

-- Match scores (aggregated team performance)
CREATE TABLE IF NOT EXISTS match_scores (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  total_goals INTEGER DEFAULT 0,
  total_kicks INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, team_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(team_a_id, team_b_id);
CREATE INDEX IF NOT EXISTS idx_solo_competitions_status ON solo_competitions(status);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_player ON match_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_solo_participants_competition ON solo_participants(solo_competition_id);
CREATE INDEX IF NOT EXISTS idx_solo_participants_player ON solo_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_kick_log_player ON kick_log(player_id);
CREATE INDEX IF NOT EXISTS idx_kick_log_match ON kick_log(match_id);
CREATE INDEX IF NOT EXISTS idx_kick_log_solo ON kick_log(solo_competition_id);
CREATE INDEX IF NOT EXISTS idx_kick_log_competition_type ON kick_log(competition_type);

-- Add team slug generation for existing teams
UPDATE teams SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')) WHERE slug IS NULL;

-- Create unique constraint for team slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug) WHERE slug IS NOT NULL;

COMMENT ON TABLE matches IS 'Head-to-head matches between two teams';
COMMENT ON TABLE solo_competitions IS 'Individual competitions where players compete without team affiliation';
COMMENT ON TABLE kick_log IS 'Unified log of all kicks from both matches and solo competitions';

-- Grant permissions
GRANT ALL PRIVILEGES ON matches TO striker_splash;
GRANT ALL PRIVILEGES ON solo_competitions TO striker_splash;
GRANT ALL PRIVILEGES ON match_participants TO striker_splash;
GRANT ALL PRIVILEGES ON solo_participants TO striker_splash;
GRANT ALL PRIVILEGES ON kick_log TO striker_splash;
GRANT ALL PRIVILEGES ON match_scores TO striker_splash;

-- Grant sequence permissions
GRANT ALL PRIVILEGES ON SEQUENCE matches_id_seq TO striker_splash;
GRANT ALL PRIVILEGES ON SEQUENCE solo_competitions_id_seq TO striker_splash;
GRANT ALL PRIVILEGES ON SEQUENCE match_participants_id_seq TO striker_splash;
GRANT ALL PRIVILEGES ON SEQUENCE solo_participants_id_seq TO striker_splash;
GRANT ALL PRIVILEGES ON SEQUENCE kick_log_id_seq TO striker_splash;
GRANT ALL PRIVILEGES ON SEQUENCE match_scores_id_seq TO striker_splash;

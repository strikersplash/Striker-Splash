-- Add new fields to players table
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS name_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kicks_balance INTEGER DEFAULT 0;

-- Create queue tickets table if not exists
CREATE TABLE IF NOT EXISTS queue_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number BIGINT NOT NULL,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('in-queue', 'played', 'expired')),
  competition_type VARCHAR(20) NOT NULL DEFAULT 'accuracy',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  played_at TIMESTAMP,
  expired_at TIMESTAMP
);

-- Create global counters table if not exists
CREATE TABLE IF NOT EXISTS global_counters (
  id VARCHAR(50) PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0
);

-- Insert initial queue counter if not exists
INSERT INTO global_counters (id, value)
SELECT 'next_queue_number', 1000
WHERE NOT EXISTS (SELECT 1 FROM global_counters WHERE id = 'next_queue_number');

-- Create competition types table if not exists
CREATE TABLE IF NOT EXISTS competition_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- Insert default competition types if not exists
INSERT INTO competition_types (name, description)
SELECT 'accuracy', 'Standard accuracy competition'
WHERE NOT EXISTS (SELECT 1 FROM competition_types WHERE name = 'accuracy');

INSERT INTO competition_types (name, description)
SELECT 'speed', 'Speed competition'
WHERE NOT EXISTS (SELECT 1 FROM competition_types WHERE name = 'speed');

INSERT INTO competition_types (name, description)
SELECT 'juggling', 'Juggling competition'
WHERE NOT EXISTS (SELECT 1 FROM competition_types WHERE name = 'juggling');

-- Add competition_type to game_stats table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'game_stats' AND column_name = 'competition_type') THEN
    ALTER TABLE game_stats ADD COLUMN competition_type VARCHAR(20) DEFAULT 'accuracy';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'game_stats' AND column_name = 'queue_ticket_id') THEN
    ALTER TABLE game_stats ADD COLUMN queue_ticket_id INTEGER REFERENCES queue_tickets(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'game_stats' AND column_name = 'requeued') THEN
    ALTER TABLE game_stats ADD COLUMN requeued BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
-- Add name_change_count to players table
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS name_change_count INTEGER DEFAULT 0;

-- Update name_locked logic
UPDATE players 
SET name_locked = (name_change_count >= 2)
WHERE name_change_count IS NOT NULL;

-- Add gender to players if it doesn't exist
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Update existing players with default gender
UPDATE players
SET gender = 'male'
WHERE gender IS NULL;

-- Create ticket_ranges table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_ranges (
  id SERIAL PRIMARY KEY,
  start_ticket INTEGER NOT NULL,
  end_ticket INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- Create global_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS global_counters (
  id VARCHAR(50) PRIMARY KEY,
  value INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert next_queue_number if it doesn't exist
INSERT INTO global_counters (id, value)
VALUES ('next_queue_number', 1000)
ON CONFLICT (id) DO NOTHING;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
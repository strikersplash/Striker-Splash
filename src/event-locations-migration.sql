-- Drop and recreate the event_locations table with new columns
DROP TABLE IF EXISTS event_locations;

CREATE TABLE event_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'practice', -- 'practice' or 'competition'
  max_kicks INTEGER NOT NULL DEFAULT 5,
  tickets_required INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES event_locations(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kicks_requested INTEGER NOT NULL DEFAULT 1,
  is_competition BOOLEAN NOT NULL DEFAULT false,
  tickets_used INTEGER NOT NULL,
  registration_date TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Insert test event locations
INSERT INTO event_locations (name, address, start_date, end_date, event_type, max_kicks, tickets_required, description)
VALUES
  ('Belize City - BTL Park', '123 Seaside Drive, Belize City', '2025-06-26', '2025-06-30', 'practice', 5, 1, 'Join us for practice sessions at BTL Park'),
  ('Orange Walk - Central Park', '45 Main St, Orange Walk', '2025-07-05', '2025-07-07', 'competition', 3, 2, 'Competition event with prizes');

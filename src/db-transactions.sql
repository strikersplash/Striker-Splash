-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  staff_id INTEGER REFERENCES staff(id),
  kicks INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  team_play BOOLEAN DEFAULT FALSE
);
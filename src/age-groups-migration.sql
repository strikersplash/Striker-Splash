-- Age Groups Migration SQL
-- This file creates the age_brackets table and updates the age group system

-- Create age_brackets table if it doesn't exist
CREATE TABLE IF NOT EXISTS age_brackets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER, -- Allow NULL for open-ended ranges like "51+"
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Remove the old age_group constraint from players table
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_age_group_check;

-- Update age_group column to allow longer strings
ALTER TABLE players ALTER COLUMN age_group TYPE VARCHAR(50);

-- Create new age brackets with the updated 5 age ranges
INSERT INTO age_brackets (name, min_age, max_age, active) VALUES
  ('Up to 10 years', 0, 10, true),
  ('Teens 11-17 years', 11, 17, true),
  ('Young Adults 18-30 years', 18, 30, true),
  ('Adults 31-50 years', 31, 50, true),
  ('Seniors 51+ years', 51, NULL, true)
ON CONFLICT DO NOTHING;

-- Update existing players based on their current age groups using the new calculation logic
-- This will be done by the calculateAgeGroup function in the application

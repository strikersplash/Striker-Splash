-- Modify daily raffles to allow multiple draws per day
-- This script allows drawing winners multiple times per day and keeps all tickets in the pool

-- First, drop the unique constraint on raffle_date
ALTER TABLE daily_raffles DROP CONSTRAINT daily_raffles_raffle_date_key;

-- Add a draw_number column to track multiple draws per day
ALTER TABLE daily_raffles ADD COLUMN draw_number INTEGER DEFAULT 1;

-- Create a unique constraint on raffle_date + draw_number instead
ALTER TABLE daily_raffles ADD CONSTRAINT daily_raffles_raffle_date_draw_number_key 
  UNIQUE (raffle_date, draw_number);

-- Add a notes column for any additional information about the draw
ALTER TABLE daily_raffles ADD COLUMN notes TEXT;

-- Update any existing records to have draw_number = 1
UPDATE daily_raffles SET draw_number = 1 WHERE draw_number IS NULL;

-- Create an index for better performance when querying by date
CREATE INDEX idx_daily_raffles_raffle_date ON daily_raffles(raffle_date);
CREATE INDEX idx_daily_raffles_drawn_at ON daily_raffles(drawn_at);

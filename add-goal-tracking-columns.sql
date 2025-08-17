-- Add goals and kicks_taken columns to competition_players table
-- Migration: Add goal tracking columns

ALTER TABLE competition_players 
ADD COLUMN IF NOT EXISTS goals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kicks_taken INTEGER DEFAULT 0;

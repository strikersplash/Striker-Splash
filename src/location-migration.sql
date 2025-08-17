-- Database Migration: Add City/Village Field
-- This migration adds a city_village field to the players table
-- and updates display logic to show "Location: City/Village, District"

-- Add city_village column to players table
ALTER TABLE players ADD COLUMN city_village VARCHAR(100);

-- For existing players, extract city from current residence if possible
-- This attempts to parse existing data where residence might contain city info
UPDATE players SET city_village = 
  CASE 
    WHEN residence = 'Belize City' THEN 'Belize City'
    WHEN residence = 'San Pedro' THEN 'San Pedro'
    WHEN residence = 'Belmopan' THEN 'Belmopan'
    WHEN residence = 'Placencia' THEN 'Placencia'
    WHEN residence = 'Dangriga' THEN 'Dangriga'
    WHEN residence = 'Orange Walk' THEN 'Orange Walk Town'
    WHEN residence = 'Corozal' THEN 'Corozal Town'
    WHEN residence = 'Punta Gorda' THEN 'Punta Gorda'
    WHEN residence = 'San Ignacio' THEN 'San Ignacio'
    WHEN residence = 'Benque Viejo' THEN 'Benque Viejo del Carmen'
    ELSE 'Not Specified'
  END;

-- Update residence to be district names
UPDATE players SET residence = 
  CASE 
    WHEN residence = 'Belize City' THEN 'Belize'
    WHEN residence = 'San Pedro' THEN 'Belize'
    WHEN residence = 'Belmopan' THEN 'Cayo'
    WHEN residence = 'Placencia' THEN 'Stann Creek'
    WHEN residence = 'Dangriga' THEN 'Stann Creek'
    WHEN residence = 'Orange Walk' THEN 'Orange Walk'
    WHEN residence = 'Corozal' THEN 'Corozal'
    WHEN residence = 'Punta Gorda' THEN 'Toledo'
    WHEN residence = 'San Ignacio' THEN 'Cayo'
    WHEN residence = 'Benque Viejo' THEN 'Cayo'
    ELSE residence -- Keep as is for 'Other' or custom entries
  END;

-- Make city_village required for future records (but allow existing NULL values)
-- We'll handle this in the application layer for new registrations

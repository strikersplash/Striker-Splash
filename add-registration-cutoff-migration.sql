-- Add registration_closed field to event_locations table
ALTER TABLE event_locations 
ADD COLUMN registration_closed BOOLEAN NOT NULL DEFAULT false;

-- Add registration_closed_at field to track when registration was closed
ALTER TABLE event_locations 
ADD COLUMN registration_closed_at TIMESTAMP NULL;

-- Add registration_closed_by field to track which staff member closed registration
ALTER TABLE event_locations 
ADD COLUMN registration_closed_by INTEGER NULL REFERENCES staff(id);

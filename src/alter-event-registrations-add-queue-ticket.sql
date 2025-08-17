-- Add queue_ticket_id column to event_registrations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'event_registrations' AND column_name = 'queue_ticket_id'
    ) THEN
        ALTER TABLE event_registrations ADD COLUMN queue_ticket_id INTEGER REFERENCES queue_tickets(id);
    END IF;
END
$$;

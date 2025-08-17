-- Add registration_number column to event_registrations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'event_registrations' AND column_name = 'registration_number'
    ) THEN
        ALTER TABLE event_registrations ADD COLUMN registration_number INTEGER;
        
        -- Update existing records with sequential numbers by event
        WITH numbered_regs AS (
            SELECT id, event_id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY registration_date) as reg_num
            FROM event_registrations
        )
        UPDATE event_registrations er
        SET registration_number = nr.reg_num
        FROM numbered_regs nr
        WHERE er.id = nr.id;
        
        -- Add a NOT NULL constraint after filling existing data
        ALTER TABLE event_registrations ALTER COLUMN registration_number SET NOT NULL;
    END IF;
END
$$;

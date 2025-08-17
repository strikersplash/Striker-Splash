-- Check if notifications table exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Create notifications table
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          read_at TIMESTAMP
        );

        -- Create index for faster retrieval
        CREATE INDEX idx_notifications_player_id ON notifications (player_id);
        
        -- Add example notification for testing
        INSERT INTO notifications (player_id, message, type, is_read)
        SELECT id, 'Welcome to Striker Splash! Get ready for exciting football goals!', 'welcome', false
        FROM players LIMIT 3;
    ELSE
        -- Table exists, check if we need to add columns
        IF NOT EXISTS (
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='message'
        ) THEN
            ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT 'Notification';
        END IF;
        
        IF NOT EXISTS (
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='type'
        ) THEN
            ALTER TABLE notifications ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'system';
        END IF;
        
        IF NOT EXISTS (
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='is_read'
        ) THEN
            ALTER TABLE notifications ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='read_at'
        ) THEN
            ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
        END IF;
    END IF;
END
$$;

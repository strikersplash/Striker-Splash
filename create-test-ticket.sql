-- Create a test queue ticket for testing the Log Goals button
-- Get next ticket number and create ticket
DO $$
DECLARE
    next_ticket_num BIGINT;
BEGIN
    -- Get and increment ticket number
    UPDATE global_counters SET value = value + 1 WHERE id = 'next_queue_number' RETURNING value INTO next_ticket_num;
    
    -- Insert the test ticket using player ID 2 (Joshua Smith)
    INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type) 
    VALUES (next_ticket_num, 2, 'waiting', 'standard');
    
    -- Show what we created
    RAISE NOTICE 'Created test ticket #% for player ID 2', next_ticket_num;
END $$;

-- Show the current queue status
SELECT ticket_number, player_id, status, competition_type, created_at 
FROM queue_tickets 
WHERE status = 'waiting' 
ORDER BY ticket_number;

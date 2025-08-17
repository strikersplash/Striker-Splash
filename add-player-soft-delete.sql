-- Add soft delete capability to players table
-- This allows marking players as deleted while preserving transaction history for sales reports

ALTER TABLE players ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE players ADD COLUMN deleted_by INTEGER;

-- Add foreign key to staff table for audit trail
ALTER TABLE players 
ADD CONSTRAINT fk_players_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES staff(id);

-- Add index for performance when filtering out deleted players
CREATE INDEX idx_players_deleted_at ON players(deleted_at);

-- Add comments for documentation
COMMENT ON COLUMN players.deleted_at IS 'Timestamp when player was soft deleted (NULL = active player)';
COMMENT ON COLUMN players.deleted_by IS 'Staff member who deleted the player (for audit trail)';

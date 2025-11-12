-- Add new fields to players table for quick wins
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS contract_expires date,
ADD COLUMN IF NOT EXISTS scout_notes text,
ADD COLUMN IF NOT EXISTS video_link text;

-- Add comment for clarity
COMMENT ON COLUMN players.contract_expires IS 'Contract expiration date for easy tracking';
COMMENT ON COLUMN players.scout_notes IS 'Free-text notes from scouts about the player';
COMMENT ON COLUMN players.video_link IS 'Link to player highlight videos or match footage';
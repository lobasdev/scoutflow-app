-- Add tags column to players table
ALTER TABLE players ADD COLUMN tags text[] DEFAULT '{}';

-- Create index for better tag search performance
CREATE INDEX idx_players_tags ON players USING GIN(tags);
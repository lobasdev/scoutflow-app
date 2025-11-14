-- Add display_order column to player_shortlists table
ALTER TABLE player_shortlists
ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Create index for better query performance when ordering
CREATE INDEX idx_player_shortlists_order ON player_shortlists(shortlist_id, display_order);
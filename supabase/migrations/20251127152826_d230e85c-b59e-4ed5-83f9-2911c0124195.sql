-- Add new fields to matches table
ALTER TABLE matches 
ADD COLUMN weather TEXT,
ADD COLUMN kickoff_time TIME,
ADD COLUMN match_video_link TEXT;

-- Allow observations to have null player_id for quick match observations
ALTER TABLE observations 
ALTER COLUMN player_id DROP NOT NULL;
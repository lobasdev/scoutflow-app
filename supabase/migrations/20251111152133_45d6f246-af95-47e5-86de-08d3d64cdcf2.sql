-- Add new profile fields to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS profile_summary TEXT,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS weight INTEGER,
ADD COLUMN IF NOT EXISTS recommendation TEXT,
ADD COLUMN IF NOT EXISTS appearances INTEGER;

-- Add check constraint for recommendation values
ALTER TABLE players 
ADD CONSTRAINT recommendation_check 
CHECK (recommendation IS NULL OR recommendation IN ('Sign', 'Observe more', 'Not sign', 'Invite for trial'));
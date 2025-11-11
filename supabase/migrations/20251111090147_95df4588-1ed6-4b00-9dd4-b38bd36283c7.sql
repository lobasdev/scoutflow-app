-- Add new fields to players table
ALTER TABLE public.players 
ADD COLUMN nationality TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN estimated_value TEXT,
ADD COLUMN photo_url TEXT;
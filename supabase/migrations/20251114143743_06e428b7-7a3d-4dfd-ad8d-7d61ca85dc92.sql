-- Add new fields for enhanced player profiles
ALTER TABLE players
ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weaknesses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risks TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ceiling_level TEXT,
ADD COLUMN IF NOT EXISTS sell_on_potential INTEGER CHECK (sell_on_potential >= 0 AND sell_on_potential <= 10),
ADD COLUMN IF NOT EXISTS transfer_potential_comment TEXT,
ADD COLUMN IF NOT EXISTS shirt_number TEXT;
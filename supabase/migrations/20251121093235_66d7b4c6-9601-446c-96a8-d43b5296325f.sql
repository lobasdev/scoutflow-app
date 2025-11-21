-- Add new optional fields to players table
ALTER TABLE public.players
ADD COLUMN current_salary text,
ADD COLUMN expected_salary text,
ADD COLUMN agency text,
ADD COLUMN agency_link text;
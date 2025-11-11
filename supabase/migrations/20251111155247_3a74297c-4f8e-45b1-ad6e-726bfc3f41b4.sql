-- Add numeric estimated_value column and migrate data
ALTER TABLE public.players 
ADD COLUMN estimated_value_numeric bigint;

-- Function to parse estimated value from text to number
-- Handles formats like "€2.5M", "€500K", "$1M", etc.
CREATE OR REPLACE FUNCTION parse_estimated_value(value_text text)
RETURNS bigint AS $$
DECLARE
  clean_value text;
  numeric_part numeric;
  multiplier bigint;
BEGIN
  IF value_text IS NULL OR value_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove currency symbols and whitespace
  clean_value := regexp_replace(value_text, '[€$£¥\s]', '', 'g');
  
  -- Check for multiplier suffix
  IF clean_value ~* 'M$' THEN
    multiplier := 1000000;
    clean_value := regexp_replace(clean_value, 'M$', '', 'i');
  ELSIF clean_value ~* 'K$' THEN
    multiplier := 1000;
    clean_value := regexp_replace(clean_value, 'K$', '', 'i');
  ELSIF clean_value ~* 'B$' THEN
    multiplier := 1000000000;
    clean_value := regexp_replace(clean_value, 'B$', '', 'i');
  ELSE
    multiplier := 1;
  END IF;
  
  -- Convert to numeric and multiply
  BEGIN
    numeric_part := clean_value::numeric;
    RETURN (numeric_part * multiplier)::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing data
UPDATE public.players 
SET estimated_value_numeric = parse_estimated_value(estimated_value)
WHERE estimated_value IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.players.estimated_value_numeric IS 'Player estimated value in base currency units (e.g., euros). Old text column kept for reference.';
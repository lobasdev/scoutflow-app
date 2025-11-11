-- Fix security warning: set search_path for parse_estimated_value function
DROP FUNCTION IF EXISTS parse_estimated_value(text);

CREATE OR REPLACE FUNCTION parse_estimated_value(value_text text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
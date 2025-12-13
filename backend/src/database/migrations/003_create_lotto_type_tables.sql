-- Migration: Create separate tables for each lotto type
-- This allows predictions to be done per draw type for better accuracy
-- The main 'draws' table is kept for mixed/combined predictions

-- Function to create a lotto type-specific table
CREATE OR REPLACE FUNCTION create_lotto_type_table(lotto_type_name TEXT)
RETURNS void AS $$
DECLARE
  table_name TEXT;
  normalized_name TEXT;
BEGIN
  -- Normalize the lotto type name to a valid table name
  normalized_name := lower(trim(lotto_type_name));
  normalized_name := regexp_replace(normalized_name, '[^a-z0-9]+', '_', 'g');
  normalized_name := regexp_replace(normalized_name, '^_+|_+$', '', 'g');
  normalized_name := regexp_replace(normalized_name, '_+', '_', 'g');
  
  table_name := 'draws_' || normalized_name;
  
  -- Create table if it doesn't exist
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      draw_date DATE NOT NULL,
      lotto_type TEXT NOT NULL,
      winning_numbers INTEGER[5] NOT NULL,
      machine_numbers INTEGER[5] NOT NULL,
      source TEXT,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB,
      CONSTRAINT unique_draw_date_type_%s UNIQUE (draw_date, lotto_type)
    )',
    table_name,
    normalized_name
  );
  
  -- Create indexes
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_draw_date ON %I(draw_date)', normalized_name, table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_lotto_type ON %I(lotto_type)', normalized_name, table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_winning_numbers_gin ON %I USING GIN (winning_numbers)', normalized_name, table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_machine_numbers_gin ON %I USING GIN (machine_numbers)', normalized_name, table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_published_at ON %I(published_at DESC)', normalized_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Function to populate a lotto type table from the main draws table
CREATE OR REPLACE FUNCTION populate_lotto_type_table(lotto_type_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  table_name TEXT;
  normalized_name TEXT;
  inserted_count INTEGER;
BEGIN
  -- Normalize the lotto type name
  normalized_name := lower(trim(lotto_type_name));
  normalized_name := regexp_replace(normalized_name, '[^a-z0-9]+', '_', 'g');
  normalized_name := regexp_replace(normalized_name, '^_+|_+$', '', 'g');
  normalized_name := regexp_replace(normalized_name, '_+', '_', 'g');
  
  table_name := 'draws_' || normalized_name;
  
  -- Create the table if it doesn't exist
  PERFORM create_lotto_type_table(lotto_type_name);
  
  -- Insert draws for this lotto type (avoiding duplicates)
  EXECUTE format('
    INSERT INTO %I (
      id, draw_date, lotto_type, winning_numbers, machine_numbers, 
      source, published_at, created_at, updated_at, metadata
    )
    SELECT 
      id, draw_date, lotto_type, winning_numbers, machine_numbers,
      source, published_at, created_at, updated_at, metadata
    FROM draws
    WHERE lotto_type = $1
    ON CONFLICT DO NOTHING
  ', table_name) USING lotto_type_name;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get all lotto types from the database
CREATE OR REPLACE FUNCTION get_all_lotto_types()
RETURNS TABLE(lotto_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT lotto_type
  FROM draws
  WHERE lotto_type IS NOT NULL
  ORDER BY lotto_type;
END;
$$ LANGUAGE plpgsql;

-- Automatically create tables for existing lotto types
DO $$
DECLARE
  lotto_type_record RECORD;
BEGIN
  FOR lotto_type_record IN 
    SELECT DISTINCT lotto_type 
    FROM draws 
    WHERE lotto_type IS NOT NULL
  LOOP
    PERFORM create_lotto_type_table(lotto_type_record.lotto_type);
    PERFORM populate_lotto_type_table(lotto_type_record.lotto_type);
  END LOOP;
END $$;

-- Create a trigger function to automatically insert into type-specific table
CREATE OR REPLACE FUNCTION sync_to_lotto_type_table()
RETURNS TRIGGER AS $$
DECLARE
  table_name TEXT;
  normalized_name TEXT;
BEGIN
  -- Normalize the lotto type name
  normalized_name := lower(trim(NEW.lotto_type));
  normalized_name := regexp_replace(normalized_name, '[^a-z0-9]+', '_', 'g');
  normalized_name := regexp_replace(normalized_name, '^_+|_+$', '', 'g');
  normalized_name := regexp_replace(normalized_name, '_+', '_', 'g');
  
  table_name := 'draws_' || normalized_name;
  
  -- Create table if it doesn't exist
  PERFORM create_lotto_type_table(NEW.lotto_type);
  
  -- Insert into type-specific table
  EXECUTE format('
    INSERT INTO %I (
      id, draw_date, lotto_type, winning_numbers, machine_numbers,
      source, published_at, created_at, updated_at, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT DO NOTHING
  ', table_name) USING 
    NEW.id, NEW.draw_date, NEW.lotto_type, NEW.winning_numbers, 
    NEW.machine_numbers, NEW.source, NEW.published_at, 
    NEW.created_at, NEW.updated_at, NEW.metadata;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on main draws table
DROP TRIGGER IF EXISTS trigger_sync_to_lotto_type_table ON draws;
CREATE TRIGGER trigger_sync_to_lotto_type_table
  AFTER INSERT ON draws
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_lotto_type_table();


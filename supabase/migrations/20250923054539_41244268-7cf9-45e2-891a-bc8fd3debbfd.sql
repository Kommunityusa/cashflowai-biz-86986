-- Fix security issue: Move extensions from public schema to a dedicated schema
-- Extensions in the public schema can pose security risks

-- Create a dedicated schema for extensions if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move commonly used extensions to the extensions schema
-- Note: Some extensions like uuid-ossp or pgcrypto might be in use

-- Check and move uuid-ossp if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'uuid-ossp' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
END $$;

-- Check and move pgcrypto if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Check and move any other common extensions
DO $$
BEGIN
  -- Move pg_trgm if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_trgm' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;

  -- Move btree_gist if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'btree_gist' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION btree_gist SET SCHEMA extensions;
  END IF;

  -- Move btree_gin if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'btree_gin' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION btree_gin SET SCHEMA extensions;
  END IF;
END $$;

-- Update search_path to include extensions schema for functions that might need it
-- This ensures existing code continues to work
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Add comment documenting the security improvement
COMMENT ON SCHEMA extensions IS 'Dedicated schema for PostgreSQL extensions to improve security by isolating them from the public schema';
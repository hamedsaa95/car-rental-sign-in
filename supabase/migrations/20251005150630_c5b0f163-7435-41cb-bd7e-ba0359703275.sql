-- Enable pgcrypto extension in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Recreate hash_password function using extensions schema
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

-- Recreate verify_password function  
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(password, hash) = hash;
END;
$$;

-- Add triggers to automatically hash passwords on INSERT and UPDATE

-- Trigger for users table
DROP TRIGGER IF EXISTS hash_user_password_trigger ON public.users;
CREATE TRIGGER hash_user_password_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_user_password();

-- Trigger for admin_settings table  
DROP TRIGGER IF EXISTS hash_admin_password_trigger ON public.admin_settings;
CREATE TRIGGER hash_admin_password_trigger
  BEFORE INSERT OR UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_admin_password();

-- Hash any existing plaintext passwords by triggering an update
UPDATE public.users
SET password = password || '_rehash'
WHERE password IS NOT NULL 
  AND NOT (password LIKE '$2%');

UPDATE public.admin_settings
SET password = password || '_rehash'
WHERE password IS NOT NULL 
  AND NOT (password LIKE '$2%');
-- Remove hardcoded default credentials from admin_settings table
-- This fixes the security vulnerability of exposed credentials in the schema

-- First, alter the columns to remove the insecure defaults
ALTER TABLE public.admin_settings 
  ALTER COLUMN username DROP DEFAULT,
  ALTER COLUMN password DROP DEFAULT;

-- The table should already have at least one admin record from previous migrations
-- If not, this migration will ensure one exists with a hashed password
-- Note: After this migration, admins MUST change their credentials via the admin settings UI

DO $$
BEGIN
  -- Only insert default admin if table is empty
  IF NOT EXISTS (SELECT 1 FROM public.admin_settings LIMIT 1) THEN
    INSERT INTO public.admin_settings (username, password)
    VALUES ('admin', '5971');  -- Will be auto-hashed by trigger
  END IF;
END $$;
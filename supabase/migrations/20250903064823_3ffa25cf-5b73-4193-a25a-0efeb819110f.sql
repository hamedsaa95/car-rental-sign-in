-- Security Fix: Secure Admin Settings and Implement Password Hashing (Fixed)

-- Step 1: Create password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords  
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Hash existing admin password
UPDATE admin_settings 
SET password = public.hash_password(password)
WHERE NOT (password LIKE '$2%');

-- Step 3: Update RLS policies to restrict admin_settings access
DROP POLICY IF EXISTS "Anyone can access admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admin settings are private" ON admin_settings;

-- Create secure RLS policies for admin_settings - completely private
CREATE POLICY "Admin settings are completely private"
ON admin_settings FOR ALL
USING (false)
WITH CHECK (false);

-- Create a security definer function for authentication that can access admin_settings
CREATE OR REPLACE FUNCTION public.authenticate_admin_secure(username_input text, password_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record record;
  result json;
BEGIN
  -- Search for admin data using hashed password verification
  SELECT username, password INTO admin_record
  FROM admin_settings
  WHERE username = username_input
  LIMIT 1;
  
  -- Verify admin exists and password matches
  IF admin_record IS NOT NULL AND public.verify_password(password_input, admin_record.password) THEN
    result := json_build_object(
      'success', true,
      'user_id', gen_random_uuid()::text,
      'username', admin_record.username,
      'user_type', 'admin'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'بيانات المدير غير صحيحة'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Step 4: Create trigger to automatically hash passwords on insert/update
CREATE OR REPLACE FUNCTION public.hash_admin_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if password is not already hashed (doesn't start with $2)
  IF NEW.password IS NOT NULL AND NOT (NEW.password LIKE '$2%') THEN
    NEW.password = public.hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin_settings password hashing
DROP TRIGGER IF EXISTS hash_admin_password_trigger ON admin_settings;
CREATE TRIGGER hash_admin_password_trigger
  BEFORE INSERT OR UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_admin_password();

-- Step 5: Update the users table to also use hashed passwords for security
-- Add trigger to hash user passwords as well
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if password is not already hashed (doesn't start with $2)
  IF NEW.password IS NOT NULL AND NOT (NEW.password LIKE '$2%') THEN
    NEW.password = public.hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for users password hashing
DROP TRIGGER IF EXISTS hash_user_password_trigger ON users;
CREATE TRIGGER hash_user_password_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_user_password();

-- Hash existing user passwords
UPDATE users 
SET password = public.hash_password(password)
WHERE NOT (password LIKE '$2%');

-- Step 6: Create secure user authentication function
CREATE OR REPLACE FUNCTION public.authenticate_user_secure(username_input text, password_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record record;
  result json;
BEGIN
  -- Search for user data using hashed password verification
  SELECT id, username, password, user_type, search_limit, remaining_searches, phone_number, company_name
  INTO user_record
  FROM users
  WHERE username = username_input
  LIMIT 1;
  
  -- Verify user exists and password matches
  IF user_record IS NOT NULL AND public.verify_password(password_input, user_record.password) THEN
    result := json_build_object(
      'success', true,
      'id', user_record.id,
      'username', user_record.username,
      'user_type', user_record.user_type,
      'search_limit', user_record.search_limit,
      'remaining_searches', user_record.remaining_searches,
      'phone_number', user_record.phone_number,
      'company_name', user_record.company_name
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'اسم المستخدم أو كلمة المرور غير صحيحة'
    );
  END IF;
  
  RETURN result;
END;
$$;
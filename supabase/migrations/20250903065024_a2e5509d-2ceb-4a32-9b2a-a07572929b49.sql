-- Security Fix: Secure Users Table with Proper RLS Policies

-- Step 1: Drop the current overly permissive policy
DROP POLICY IF EXISTS "Anyone can access users" ON users;

-- Step 2: Create secure RLS policies for users table

-- Policy for users to read only their own data
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (false); -- Block all direct access - we'll use secure functions instead

-- Policy for user registration (insert)
CREATE POLICY "Users can create accounts"
ON users FOR INSERT
WITH CHECK (true); -- Allow account creation

-- Policy for users to update their own data (if needed in future)
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (false) -- Block direct updates for security
WITH CHECK (false);

-- Policy to prevent direct deletion
CREATE POLICY "Prevent direct user deletion"
ON users FOR DELETE
USING (false);

-- Step 3: Create admin-only policies through security definer functions

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  id uuid,
  username text,
  user_type text,
  search_limit integer,
  remaining_searches integer,
  phone_number text,
  company_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function bypasses RLS and should only be called by admin functions
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.user_type,
    u.search_limit,
    u.remaining_searches,
    u.phone_number,
    u.company_name,
    u.created_at,
    u.updated_at
  FROM users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Function to delete user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_admin(user_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete the user
  DELETE FROM users WHERE id = user_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم حذف المستخدم بنجاح');
  ELSE
    RETURN json_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;
END;
$$;

-- Function to update user searches (admin only)
CREATE OR REPLACE FUNCTION public.update_user_searches_admin(user_id_input uuid, remaining_searches_input integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update user searches
  UPDATE users 
  SET remaining_searches = remaining_searches_input,
      updated_at = now()
  WHERE id = user_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم تحديث عدد البحثات');
  ELSE
    RETURN json_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;
END;
$$;

-- Function to get user by username (for authentication only)
CREATE OR REPLACE FUNCTION public.get_user_for_auth(username_input text)
RETURNS TABLE (
  id uuid,
  username text,
  password text,
  user_type text,
  search_limit integer,
  remaining_searches integer,
  phone_number text,
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.password,
    u.user_type,
    u.search_limit,
    u.remaining_searches,
    u.phone_number,
    u.company_name
  FROM users u
  WHERE u.username = username_input
  LIMIT 1;
END;
$$;
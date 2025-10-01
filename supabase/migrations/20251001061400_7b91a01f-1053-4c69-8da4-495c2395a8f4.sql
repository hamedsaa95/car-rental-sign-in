-- Drop existing insecure policies on users table
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Create secure policies that deny all direct access
-- All operations must go through SECURITY DEFINER functions
CREATE POLICY "users_no_direct_insert" ON public.users
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "users_no_direct_select" ON public.users
FOR SELECT 
USING (false);

CREATE POLICY "users_no_direct_update" ON public.users
FOR UPDATE 
USING (false);

CREATE POLICY "users_no_direct_delete" ON public.users
FOR DELETE 
USING (false);

-- Create secure function for creating users
CREATE OR REPLACE FUNCTION public.create_user_secure(
  username_input text,
  password_input text,
  user_type_input text,
  search_limit_input integer DEFAULT 1000,
  remaining_searches_input integer DEFAULT 1000,
  phone_number_input text DEFAULT NULL,
  company_name_input text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user record;
  new_user record;
  result json;
BEGIN
  -- Check if username already exists
  SELECT username INTO existing_user
  FROM users
  WHERE username = username_input
  LIMIT 1;
  
  IF existing_user IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'اسم المستخدم موجود بالفعل'
    );
  END IF;
  
  -- Insert new user
  INSERT INTO users (
    username,
    password,
    user_type,
    search_limit,
    remaining_searches,
    phone_number,
    company_name
  )
  VALUES (
    username_input,
    password_input,
    user_type_input,
    search_limit_input,
    remaining_searches_input,
    phone_number_input,
    company_name_input
  )
  RETURNING * INTO new_user;
  
  -- Return success with user data
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', new_user.id,
      'username', new_user.username,
      'user_type', new_user.user_type,
      'search_limit', new_user.search_limit,
      'remaining_searches', new_user.remaining_searches,
      'phone_number', new_user.phone_number,
      'company_name', new_user.company_name,
      'created_at', new_user.created_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
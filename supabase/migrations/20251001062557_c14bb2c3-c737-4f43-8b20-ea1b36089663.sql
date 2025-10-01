-- Create secure function for adding blocked users
CREATE OR REPLACE FUNCTION public.add_blocked_user_secure(
  user_id_input text,
  name_input text,
  reason_input text,
  created_by_input text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_blocked_user record;
BEGIN
  -- Insert new blocked user
  INSERT INTO blocked_users (
    user_id,
    name,
    reason,
    created_by
  )
  VALUES (
    user_id_input,
    name_input,
    reason_input,
    created_by_input
  )
  RETURNING * INTO new_blocked_user;
  
  -- Return success with blocked user data
  RETURN json_build_object(
    'success', true,
    'blocked_user', json_build_object(
      'id', new_blocked_user.id,
      'user_id', new_blocked_user.user_id,
      'name', new_blocked_user.name,
      'reason', new_blocked_user.reason,
      'created_by', new_blocked_user.created_by,
      'created_at', new_blocked_user.created_at
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

-- Create secure function for removing blocked users
CREATE OR REPLACE FUNCTION public.remove_blocked_user_secure(
  user_id_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the blocked user
  DELETE FROM blocked_users WHERE user_id = user_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم إلغاء الحظر بنجاح');
  ELSE
    RETURN json_build_object('success', false, 'error', 'المستخدم المحظور غير موجود');
  END IF;
END;
$$;

-- Create secure function for getting all blocked users
CREATE OR REPLACE FUNCTION public.get_blocked_users_admin()
RETURNS TABLE(
  id uuid,
  user_id text,
  name text,
  reason text,
  created_by text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function bypasses RLS and should only be called by admin functions
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.name,
    b.reason,
    b.created_by,
    b.created_at
  FROM blocked_users b
  ORDER BY b.created_at DESC;
END;
$$;

-- Create secure function for searching blocked users
CREATE OR REPLACE FUNCTION public.search_blocked_user_secure(
  user_id_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked_record record;
BEGIN
  -- Search for blocked user
  SELECT * INTO blocked_record
  FROM blocked_users
  WHERE user_id = user_id_input
  LIMIT 1;
  
  IF blocked_record IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'blocked', true,
      'blocked_user', json_build_object(
        'id', blocked_record.id,
        'user_id', blocked_record.user_id,
        'name', blocked_record.name,
        'reason', blocked_record.reason,
        'created_by', blocked_record.created_by,
        'created_at', blocked_record.created_at
      )
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'blocked', false
    );
  END IF;
END;
$$;
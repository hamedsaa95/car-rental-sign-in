-- Fix Function Search Path Mutable issues
-- Update all functions to have proper search_path settings

-- 1. Fix hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$function$;

-- 2. Fix verify_password function
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$function$;

-- 3. Fix hash_admin_password trigger function
CREATE OR REPLACE FUNCTION public.hash_admin_password()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only hash if password is not already hashed (doesn't start with $2)
  IF NEW.password IS NOT NULL AND NOT (NEW.password LIKE '$2%') THEN
    NEW.password = public.hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix hash_user_password trigger function
CREATE OR REPLACE FUNCTION public.hash_user_password()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only hash if password is not already hashed (doesn't start with $2)
  IF NEW.password IS NOT NULL AND NOT (NEW.password LIKE '$2%') THEN
    NEW.password = public.hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 6. Fix authenticate_admin function
CREATE OR REPLACE FUNCTION public.authenticate_admin(username_input text, password_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record record;
  result json;
BEGIN
  -- البحث عن بيانات المدير
  SELECT username, password INTO admin_record
  FROM admin_settings
  WHERE username = username_input AND password = password_input
  LIMIT 1;
  
  -- التحقق من وجود المدير
  IF admin_record IS NOT NULL THEN
    result := json_build_object(
      'success', true,
      'user_id', gen_random_uuid()::text,
      'username', admin_record.username
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'بيانات المدير غير صحيحة'
    );
  END IF;
  
  RETURN result;
END;
$function$;

-- 7. Fix authenticate_admin_secure function  
CREATE OR REPLACE FUNCTION public.authenticate_admin_secure(username_input text, password_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 8. Fix authenticate_user_secure function
CREATE OR REPLACE FUNCTION public.authenticate_user_secure(username_input text, password_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 9. Fix get_all_users_admin function
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
 RETURNS TABLE(id uuid, username text, user_type text, search_limit integer, remaining_searches integer, phone_number text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 10. Fix delete_user_admin function
CREATE OR REPLACE FUNCTION public.delete_user_admin(user_id_input uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete the user
  DELETE FROM users WHERE id = user_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم حذف المستخدم بنجاح');
  ELSE
    RETURN json_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;
END;
$function$;

-- 11. Fix update_user_searches_admin function
CREATE OR REPLACE FUNCTION public.update_user_searches_admin(user_id_input uuid, remaining_searches_input integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 12. Fix get_user_for_auth function
CREATE OR REPLACE FUNCTION public.get_user_for_auth(username_input text)
 RETURNS TABLE(id uuid, username text, password text, user_type text, search_limit integer, remaining_searches integer, phone_number text, company_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 13. Add missing update_admin_credentials function with proper search_path
CREATE OR REPLACE FUNCTION public.update_admin_credentials(
  current_username text,
  current_password text,
  new_username text,
  new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_record record;
  result json;
BEGIN
  -- Verify current credentials
  SELECT username, password INTO admin_record
  FROM admin_settings
  WHERE username = current_username
  LIMIT 1;
  
  -- Check if admin exists and current password matches
  IF admin_record IS NOT NULL AND public.verify_password(current_password, admin_record.password) THEN
    -- Update credentials
    UPDATE admin_settings 
    SET username = new_username,
        password = new_password,  -- Will be auto-hashed by trigger
        updated_at = now()
    WHERE username = current_username;
    
    IF FOUND THEN
      result := json_build_object(
        'success', true,
        'message', 'تم تحديث بيانات المدير بنجاح'
      );
    ELSE
      result := json_build_object(
        'success', false,
        'error', 'فشل في تحديث بيانات المدير'
      );
    END IF;
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'بيانات المدير الحالية غير صحيحة'
    );
  END IF;
  
  RETURN result;
END;
$function$;
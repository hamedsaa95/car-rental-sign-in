-- حذف الـ triggers المعطلة مؤقتاً لحل مشكلة التشفير
DROP TRIGGER IF EXISTS hash_admin_password_trigger ON admin_settings;
DROP TRIGGER IF EXISTS hash_user_password_trigger ON users;

-- إنشاء دالة مصادقة مبسطة للمدير
CREATE OR REPLACE FUNCTION public.authenticate_admin_simple(username_input text, password_input text)
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

-- إنشاء دالة مصادقة مبسطة للمستخدمين
CREATE OR REPLACE FUNCTION public.authenticate_user_simple(username_input text, password_input text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_record record;
  result json;
BEGIN
  -- البحث عن بيانات المستخدم
  SELECT id, username, password, user_type, search_limit, remaining_searches, phone_number, company_name
  INTO user_record
  FROM users
  WHERE username = username_input AND password = password_input
  LIMIT 1;
  
  -- التحقق من وجود المستخدم
  IF user_record IS NOT NULL THEN
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
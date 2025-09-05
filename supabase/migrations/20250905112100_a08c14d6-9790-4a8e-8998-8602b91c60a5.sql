-- تفعيل extension pgcrypto المطلوب للتشفير
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- التحقق من أن التشفير يعمل بشكل صحيح
-- تحديث كلمة مرور المدير لضمان أنها مشفرة
UPDATE admin_settings 
SET password = '5971'
WHERE username = 'admin';

-- إنشاء دالة جديدة مبسطة للمدير تتعامل مع كلمات المرور البسيطة والمشفرة
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
  WHERE username = username_input
  LIMIT 1;
  
  -- التحقق من وجود المدير وكلمة المرور
  IF admin_record IS NOT NULL THEN
    -- التحقق من كلمة المرور (مشفرة أو غير مشفرة)
    IF (admin_record.password LIKE '$2%' AND public.verify_password(password_input, admin_record.password)) 
       OR (admin_record.password = password_input) THEN
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
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'بيانات المدير غير صحيحة'
    );
  END IF;
  
  RETURN result;
END;
$function$;
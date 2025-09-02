-- إنشاء دالة authenticate_admin للتحقق من بيانات المدير
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  username_input text,
  password_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- إنشاء مستخدم admin في جدول users إذا لم يكن موجوداً
INSERT INTO users (username, password, user_type, search_limit, remaining_searches)
VALUES ('admin', '5971', 'admin', NULL, NULL)
ON CONFLICT (username) DO NOTHING;

-- إنشاء مستخدم تجريبي
INSERT INTO users (username, password, user_type, search_limit, remaining_searches, phone_number, company_name)
VALUES ('user1', '1234', 'user', 10, 10, '12345678', 'شركة تجريبية')
ON CONFLICT (username) DO NOTHING;
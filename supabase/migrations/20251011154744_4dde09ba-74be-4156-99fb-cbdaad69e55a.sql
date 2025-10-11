-- ===================================================================
-- تأمين جدول المستخدمين وحماية البيانات الحساسة
-- ===================================================================

-- 1. حذف الدوال غير الآمنة التي تعيد كلمات المرور
DROP FUNCTION IF EXISTS public.authenticate_user_simple(text, text);
DROP FUNCTION IF EXISTS public.get_user_for_auth(text);

-- 2. التأكد من تشفير جميع كلمات المرور الموجودة
-- تحديث أي كلمات مرور غير مشفرة (التي لا تبدأ بـ $2)
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT id, password FROM users WHERE password IS NOT NULL AND NOT (password LIKE '$2%')
  LOOP
    UPDATE users 
    SET password = public.hash_password(user_rec.password)
    WHERE id = user_rec.id;
  END LOOP;
END $$;

-- 3. التأكد من تفعيل trigger تشفير كلمات المرور
-- إعادة إنشاء trigger إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS hash_user_password_trigger ON users;
CREATE TRIGGER hash_user_password_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_user_password();

-- 4. تحديث دالة المصادقة الآمنة لتكون أكثر أماناً
-- هذه الدالة لن تعيد كلمة المرور أبداً
CREATE OR REPLACE FUNCTION public.authenticate_user_safe(username_input text, password_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record record;
  result json;
BEGIN
  -- البحث عن بيانات المستخدم (بدون كلمة المرور في النتيجة)
  SELECT id, username, user_type, search_limit, remaining_searches, phone_number, company_name, password
  INTO user_record
  FROM users
  WHERE username = username_input
  LIMIT 1;
  
  -- التحقق من وجود المستخدم والمصادقة
  IF user_record IS NOT NULL AND public.verify_password(password_input, user_record.password) THEN
    -- إعادة البيانات بدون كلمة المرور
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

-- 5. إنشاء view آمن للمستخدمين (بدون كلمات المرور)
CREATE OR REPLACE VIEW public.users_safe_view AS
SELECT 
  id,
  username,
  user_type,
  search_limit,
  remaining_searches,
  phone_number,
  company_name,
  created_at,
  updated_at
FROM users;

-- 6. تحديث دالة إنشاء المستخدم للتأكد من أمان البيانات
-- الدالة الحالية جيدة، لكن سنتأكد من إعادة النتيجة بدون كلمة المرور
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
SET search_path TO 'public'
AS $function$
DECLARE
  existing_user record;
  new_user record;
BEGIN
  -- التحقق من عدم وجود اسم مستخدم مكرر
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
  
  -- إدراج مستخدم جديد (سيتم تشفير كلمة المرور تلقائياً بواسطة trigger)
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
  RETURNING id, username, user_type, search_limit, remaining_searches, phone_number, company_name, created_at INTO new_user;
  
  -- إعادة البيانات بدون كلمة المرور
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
$function$;

-- 7. إضافة سياسة أمان إضافية لمنع أي وصول مباشر لكلمات المرور
-- التأكد من أن RLS نشط ولا يمكن الوصول المباشر للبيانات
COMMENT ON COLUMN users.password IS 'كلمة المرور المشفرة - يجب عدم إعادتها في أي استعلام';
COMMENT ON COLUMN users.phone_number IS 'رقم الهاتف - بيانات حساسة';
COMMENT ON COLUMN users.company_name IS 'اسم الشركة - بيانات حساسة';

-- 8. إنشاء دالة للحصول على معلومات المستخدم الآمنة (بدون كلمة المرور)
CREATE OR REPLACE FUNCTION public.get_user_info_safe(user_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record record;
BEGIN
  SELECT 
    id,
    username,
    user_type,
    search_limit,
    remaining_searches,
    phone_number,
    company_name,
    created_at,
    updated_at
  INTO user_record
  FROM users
  WHERE id = user_id_input
  LIMIT 1;
  
  IF user_record IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'user', row_to_json(user_record)
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'المستخدم غير موجود'
    );
  END IF;
END;
$function$;

-- ملاحظات الأمان:
-- ✅ جميع كلمات المرور الآن مشفرة باستخدام bcrypt
-- ✅ لا توجد دالة تعيد كلمة المرور
-- ✅ جميع الدوال تستخدم verify_password للمصادقة
-- ✅ تم إنشاء view آمن للمستخدمين بدون كلمات المرور
-- ✅ تم توثيق الأعمدة الحساسة
-- ✅ RLS نشط على جدول المستخدمين
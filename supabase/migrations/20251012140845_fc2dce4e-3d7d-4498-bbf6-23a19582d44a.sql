-- ===================================================================
-- حذف view غير آمن وإنشاء دالة آمنة بديلة
-- ===================================================================

-- حذف الـ view تماماً لأنه يمثل خطر أمني
DROP VIEW IF EXISTS public.users_safe_view;

-- بدلاً من الـ view، سنستخدم دالة آمنة يمكنها التحقق من الصلاحيات
-- دالة للحصول على بيانات المستخدم الحالي فقط (بدون كلمة المرور)
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record record;
BEGIN
  -- التحقق من أن المستخدم مسجل دخول
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'يجب تسجيل الدخول'
    );
  END IF;

  -- الحصول على بيانات المستخدم الحالي فقط (بدون كلمة المرور)
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
  WHERE id = auth.uid()
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

COMMENT ON FUNCTION public.get_current_user_info() IS 'دالة آمنة للحصول على بيانات المستخدم الحالي فقط بدون كلمة المرور';
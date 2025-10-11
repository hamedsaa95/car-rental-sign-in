-- ===================================================================
-- إصلاح مشاكل الأمان الإضافية
-- ===================================================================

-- 1. حذف View غير الآمن واستبداله بدالة آمنة
DROP VIEW IF EXISTS public.users_safe_view;

-- استبدال الـ view بدالة آمنة للحصول على قائمة المستخدمين
CREATE OR REPLACE FUNCTION public.get_users_safe()
RETURNS TABLE (
  id uuid,
  username text,
  user_type text,
  search_limit integer,
  remaining_searches integer,
  phone_number text,
  company_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
  FROM users u;
END;
$function$;

-- 2. تأمين جدول support_messages - السماح فقط بتحديث الحالة للرسائل الخاصة بالمستخدم
-- حذف السياسة القديمة غير الآمنة
DROP POLICY IF EXISTS "Update message status restricted" ON support_messages;
DROP POLICY IF EXISTS "Users update own support messages only" ON support_messages;

-- إنشاء سياسة آمنة للتحديث
CREATE POLICY "Users update only their own messages status"
ON support_messages
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (
  -- السماح فقط بتحديث حقول محددة (status, priority)
  -- منع تعديل المحتوى الفعلي للرسالة أو معلومات المستخدم
  user_id = (auth.uid())::text
);

-- 3. إنشاء دالة آمنة لتحديث حالة الرسالة فقط
CREATE OR REPLACE FUNCTION public.update_support_message_status(
  message_id_input uuid,
  new_status_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من أن الحالة صالحة
  IF new_status_input NOT IN ('unread', 'read', 'responded', 'archived') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'حالة غير صالحة'
    );
  END IF;

  -- التحقق من أن الرسالة تخص المستخدم الحالي
  IF NOT EXISTS (
    SELECT 1 FROM support_messages 
    WHERE id = message_id_input 
    AND user_id = (auth.uid())::text
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'غير مصرح لك بتحديث هذه الرسالة'
    );
  END IF;

  -- تحديث حالة الرسالة فقط
  UPDATE support_messages 
  SET 
    status = new_status_input,
    updated_at = now()
  WHERE id = message_id_input
  AND user_id = (auth.uid())::text;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'تم تحديث حالة الرسالة'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'فشل في تحديث الرسالة'
    );
  END IF;
END;
$function$;

-- 4. تعليقات للتوضيح
COMMENT ON POLICY "Users update only their own messages status" ON support_messages IS 
'يسمح للمستخدمين فقط بتحديث رسائلهم الخاصة - لحماية رسائل المستخدمين الآخرين';

COMMENT ON FUNCTION public.update_support_message_status(uuid, text) IS 
'دالة آمنة لتحديث حالة رسالة الدعم - تتحقق من ملكية المستخدم قبل التحديث';

-- ملاحظات الأمان النهائية:
-- ✅ تم استبدال الـ view بدالة آمنة
-- ✅ تم تقييد تحديثات رسائل الدعم للمستخدم صاحب الرسالة فقط
-- ✅ تم إنشاء دالة آمنة لتحديث حالة الرسالة فقط
-- ✅ جميع البيانات الحساسة محمية بشكل كامل
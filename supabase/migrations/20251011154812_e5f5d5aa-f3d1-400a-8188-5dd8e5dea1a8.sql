-- ===================================================================
-- إصلاح التحذيرات الأمنية
-- ===================================================================

-- 1. إزالة SECURITY DEFINER من الـ view وإعادة إنشائه بدونه
DROP VIEW IF EXISTS public.users_safe_view;

CREATE VIEW public.users_safe_view AS
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

-- 2. إصلاح سياسة UPDATE لجدول support_messages
-- حالياً: USING: true, WITH CHECK: true (غير آمن)
-- الحل: السماح للمستخدمين بتعديل رسائلهم فقط

-- حذف السياسة الحالية غير الآمنة
DROP POLICY IF EXISTS "Update message status restricted" ON support_messages;

-- إنشاء سياسة آمنة للـ UPDATE
-- يمكن للمستخدمين تحديث رسائلهم الخاصة فقط
CREATE POLICY "Users can update own support messages"
ON support_messages
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);

-- إنشاء سياسة خاصة للمشرفين لتحديث جميع الرسائل
-- (يمكن إضافتها لاحقاً عند تطبيق نظام الأدوار)
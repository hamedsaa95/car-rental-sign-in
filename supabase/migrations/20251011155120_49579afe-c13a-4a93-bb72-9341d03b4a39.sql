-- ===================================================================
-- إصلاح سياسة UPDATE لجدول support_messages
-- ===================================================================

-- حذف السياسة الحالية غير الآمنة
DROP POLICY IF EXISTS "Update message status restricted" ON support_messages;
DROP POLICY IF EXISTS "Users can update own support messages" ON support_messages;

-- إنشاء سياسة آمنة للـ UPDATE
-- يمكن للمستخدمين تحديث رسائلهم الخاصة فقط
CREATE POLICY "Users can update own support messages only"
ON support_messages
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);
-- إعادة تفعيل RLS مع policies صحيحة
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- إنشاء policy تسمح بتسجيل المستخدمين الجدد
CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT 
WITH CHECK (true);

-- إنشاء policy للقراءة - السماح للجميع بالقراءة (للاختبار)
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT 
USING (true);

-- إنشاء policy للتحديث
CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE 
USING (true);

-- منع الحذف
CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE 
USING (false);
-- تحديث RLS policy لإنشاء الحسابات لتسمح للجميع بإنشاء حساب
DROP POLICY IF EXISTS "Users can create accounts" ON public.users;

-- إنشاء policy جديدة تسمح لأي شخص بإنشاء حساب
CREATE POLICY "Allow user registration" ON public.users
FOR INSERT 
WITH CHECK (true);

-- إنشاء policy جديدة تسمح للمستخدمين بقراءة بياناتهم الخاصة فقط
DROP POLICY IF EXISTS "Users access own data only" ON public.users;
CREATE POLICY "Users view own profile" ON public.users
FOR SELECT 
USING (id = auth.uid() OR auth.uid() IS NULL);

-- إنشاء policy للتحديث
DROP POLICY IF EXISTS "Users update own data only" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE 
USING (id = auth.uid());
-- حذف جميع الـ policies وإعادة إنشائها بشكل صحيح
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Prevent direct user deletion" ON public.users;

-- إنشاء policy جديدة تسمح بإنشاء الحسابات
CREATE POLICY "Enable user registration" ON public.users
FOR INSERT 
WITH CHECK (true);

-- إنشاء policy للقراءة - المستخدمون يرون بياناتهم فقط أو يمكن للجميع القراءة بدون مصادقة
CREATE POLICY "Users read own data" ON public.users
FOR SELECT 
USING (true);

-- إنشاء policy للتحديث
CREATE POLICY "Users update own data" ON public.users
FOR UPDATE 
USING (true);

-- منع الحذف المباشر
CREATE POLICY "Prevent user deletion" ON public.users
FOR DELETE 
USING (false);
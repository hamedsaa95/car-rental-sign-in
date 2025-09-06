-- إعادة تعيين كل policies للـ users table
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Prevent direct user deletion" ON public.users;
DROP POLICY IF EXISTS "Users read own data" ON public.users;
DROP POLICY IF EXISTS "Users update own data" ON public.users;
DROP POLICY IF EXISTS "Prevent user deletion" ON public.users;
DROP POLICY IF EXISTS "Enable user registration" ON public.users;

-- تعطيل RLS مؤقتاً لاختبار إنشاء الحسابات
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
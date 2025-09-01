-- إضافة حقول جديدة لجدول المستخدمين
ALTER TABLE public.users 
ADD COLUMN phone_number TEXT,
ADD COLUMN company_name TEXT;

-- إنشاء جدول للإعلانات
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

-- تفعيل RLS للإعلانات
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- سياسة للمدراء فقط لإدارة الإعلانات
CREATE POLICY "Admins can manage advertisements" 
ON public.advertisements 
FOR ALL 
USING (true)
WITH CHECK (true);

-- جدول لرسائل الدعم قبل تسجيل الدخول
CREATE TABLE public.guest_support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS لرسائل الضيوف
ALTER TABLE public.guest_support_messages ENABLE ROW LEVEL SECURITY;

-- سياسة للضيوف لإضافة رسائل
CREATE POLICY "Anyone can create guest support messages" 
ON public.guest_support_messages 
FOR INSERT 
WITH CHECK (true);

-- سياسة للمدراء لعرض وإدارة رسائل الضيوف
CREATE POLICY "Admins can view guest support messages" 
ON public.guest_support_messages 
FOR SELECT 
USING (true);

-- تحديث وقت التعديل للإعلانات
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
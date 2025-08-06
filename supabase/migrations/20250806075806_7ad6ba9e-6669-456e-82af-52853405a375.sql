-- إنشاء جدول المستخدمين
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'user')),
  search_limit INTEGER,
  remaining_searches INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المستخدمين المحظورين
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

-- إنشاء جدول نشاط الحسابات
CREATE TABLE public.account_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  blocked_user_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات المدير
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'admin',
  password TEXT NOT NULL DEFAULT '5971',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدخال بيانات المدير الافتراضية
INSERT INTO public.admin_settings (username, password) VALUES ('admin', '5971');

-- تفعيل RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمستخدمين (يمكن لأي شخص القراءة والكتابة)
CREATE POLICY "Anyone can access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can access blocked users" ON public.blocked_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can access account activity" ON public.account_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can access admin settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);

-- إنشاء فهارس للبحث السريع
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX idx_account_activity_username ON public.account_activity(username);

-- دالة تحديث الوقت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- مشغل التحديث للمستخدمين
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- مشغل التحديث لإعدادات المدير
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
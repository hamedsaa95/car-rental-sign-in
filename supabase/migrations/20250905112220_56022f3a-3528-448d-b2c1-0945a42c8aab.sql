-- إعادة تعيين كلمة مرور المدير إلى النص الواضح
UPDATE admin_settings 
SET password = '5971'
WHERE username = 'admin';
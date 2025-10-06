-- تحديث كلمة مرور المدير إلى "admin" (سيتم تشفيرها تلقائياً بواسطة trigger)
UPDATE admin_settings 
SET password = 'admin', 
    updated_at = now()
WHERE username = 'admin';
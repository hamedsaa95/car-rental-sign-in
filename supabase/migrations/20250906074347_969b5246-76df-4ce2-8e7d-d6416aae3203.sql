-- تحديث المستخدمين الموجودين لاستخدام القيم الجديدة للبحث
UPDATE users 
SET search_limit = 1000, 
    remaining_searches = 1000
WHERE user_type = 'user' AND (search_limit IS NULL OR search_limit = 10);
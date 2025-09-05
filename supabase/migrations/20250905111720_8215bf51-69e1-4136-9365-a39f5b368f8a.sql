-- تعديل القيمة الافتراضية لحد البحث إلى 1000 بحث
ALTER TABLE public.users 
ALTER COLUMN search_limit SET DEFAULT 1000,
ALTER COLUMN remaining_searches SET DEFAULT 1000;
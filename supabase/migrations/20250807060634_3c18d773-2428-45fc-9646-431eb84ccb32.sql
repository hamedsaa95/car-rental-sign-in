-- Enable realtime on tables
ALTER TABLE public.blocked_users REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.account_activity REPLICA IDENTITY FULL;
ALTER TABLE public.admin_settings REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
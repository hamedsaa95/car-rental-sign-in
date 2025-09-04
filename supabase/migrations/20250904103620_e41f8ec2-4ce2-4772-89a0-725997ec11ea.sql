-- Enable RLS on all tables that don't have it
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users table - users can only see their own data
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (id = auth.uid()::uuid);

-- Blocked users table - only admin functions can access
CREATE POLICY "Admin access only for blocked users" ON public.blocked_users
FOR ALL USING (false);

-- Guest support messages - only admin functions can access  
CREATE POLICY "Admin access only for guest support" ON public.guest_support_messages
FOR ALL USING (false);

-- Support messages - users can see their own messages, admin functions can see all
CREATE POLICY "Users can view their own support messages" ON public.support_messages
FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can create their own support messages" ON public.support_messages
FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Account activity - only admin functions can access
CREATE POLICY "Admin access only for account activity" ON public.account_activity
FOR ALL USING (false);

-- Support chat sessions - users can see their own sessions
CREATE POLICY "Users can view their own chat sessions" ON public.support_chat_sessions
FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can create their own chat sessions" ON public.support_chat_sessions
FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own chat sessions" ON public.support_chat_sessions
FOR UPDATE USING (user_id = auth.uid()::uuid);
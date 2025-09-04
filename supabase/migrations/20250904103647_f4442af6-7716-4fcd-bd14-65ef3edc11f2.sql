-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Admin access only for blocked users" ON public.blocked_users;
DROP POLICY IF EXISTS "Admin access only for guest support" ON public.guest_support_messages;
DROP POLICY IF EXISTS "Users can view their own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create their own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admin access only for account activity" ON public.account_activity;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.support_chat_sessions;

-- Update existing problematic policies
DROP POLICY IF EXISTS "Anyone can access blocked users" ON public.blocked_users;
DROP POLICY IF EXISTS "Anyone can access account activity" ON public.account_activity;
DROP POLICY IF EXISTS "Anyone can access chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create secure policies for blocked users - admin only access
CREATE POLICY "Blocked users admin only" ON public.blocked_users
FOR ALL USING (false);

-- Create secure policies for guest support - admin can view, anyone can create
-- Keep existing policies since they're already secure

-- Create secure policies for support messages with proper user_id matching
CREATE POLICY "Users view own support messages" ON public.support_messages
FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users create own support messages" ON public.support_messages
FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Create secure policies for account activity - admin only
CREATE POLICY "Account activity admin only" ON public.account_activity
FOR ALL USING (false);

-- Create secure policies for chat sessions with proper user_id matching
CREATE POLICY "Users view own chat sessions" ON public.support_chat_sessions
FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users create own chat sessions" ON public.support_chat_sessions
FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users update own chat sessions" ON public.support_chat_sessions
FOR UPDATE USING (user_id = auth.uid()::text);

-- Fix users table policies - the table uses uuid id, not text
CREATE POLICY "Users view own profile data" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile data" ON public.users
FOR UPDATE USING (id = auth.uid());
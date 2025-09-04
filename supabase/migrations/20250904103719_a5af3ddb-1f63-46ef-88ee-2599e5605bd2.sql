-- Fix support_messages conflicting policies
DROP POLICY IF EXISTS "Users can view their own messages and admins can view all" ON public.support_messages;

-- Keep only the secure user-specific policy for viewing support messages
-- (The secure policy "Users view own support messages" is already created)

-- Fix guest_support_messages public access
DROP POLICY IF EXISTS "Admins can view guest support messages" ON public.guest_support_messages;

-- Create admin-only policy for guest support messages
CREATE POLICY "Admin only guest support access" ON public.guest_support_messages
FOR SELECT USING (false);

-- Allow users to still create guest support messages (contact forms)
-- Keep existing "Anyone can create guest support messages" policy as it's needed for contact forms
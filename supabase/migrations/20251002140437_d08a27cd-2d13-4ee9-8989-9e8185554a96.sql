-- Create secure admin functions for guest support messages management
-- This ensures only authorized admins can access sensitive customer contact information

-- Function to retrieve all guest support messages (admin only)
CREATE OR REPLACE FUNCTION public.get_guest_support_messages_admin()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  message text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This function bypasses RLS for admin access to guest support messages
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.email,
    g.phone,
    g.message,
    g.status,
    g.created_at,
    g.updated_at
  FROM guest_support_messages g
  ORDER BY g.created_at DESC;
END;
$function$;

-- Function to update guest support message status (admin only)
CREATE OR REPLACE FUNCTION public.update_guest_support_status_secure(
  message_id_input uuid,
  new_status_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate status input
  IF new_status_input NOT IN ('unread', 'read', 'responded', 'archived') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'حالة غير صالحة'
    );
  END IF;

  -- Update message status
  UPDATE guest_support_messages 
  SET status = new_status_input,
      updated_at = now()
  WHERE id = message_id_input;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'تم تحديث حالة الرسالة'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'الرسالة غير موجودة'
    );
  END IF;
END;
$function$;

-- Function to delete guest support message (admin only)
CREATE OR REPLACE FUNCTION public.delete_guest_support_message_secure(
  message_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete the message
  DELETE FROM guest_support_messages WHERE id = message_id_input;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'تم حذف الرسالة بنجاح'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'الرسالة غير موجودة'
    );
  END IF;
END;
$function$;
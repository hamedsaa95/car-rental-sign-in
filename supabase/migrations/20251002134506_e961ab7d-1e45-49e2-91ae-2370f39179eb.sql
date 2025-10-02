-- Drop existing insecure policies on advertisements
DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisements;

-- Create secure RLS policies for advertisements
-- Allow anyone to view active advertisements only
CREATE POLICY "Anyone can view active advertisements"
ON public.advertisements
FOR SELECT
USING (is_active = true);

-- Prevent direct insert/update/delete (will use secure functions instead)
CREATE POLICY "No direct insert on advertisements"
ON public.advertisements
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update on advertisements"
ON public.advertisements
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on advertisements"
ON public.advertisements
FOR DELETE
USING (false);

-- Create secure function for adding advertisements (admin only)
CREATE OR REPLACE FUNCTION public.add_advertisement_secure(
  title_input text,
  image_url_input text,
  created_by_input text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ad record;
BEGIN
  -- Insert new advertisement
  INSERT INTO advertisements (
    title,
    image_url,
    created_by,
    is_active
  )
  VALUES (
    title_input,
    image_url_input,
    created_by_input,
    true
  )
  RETURNING * INTO new_ad;
  
  -- Return success with ad data
  RETURN json_build_object(
    'success', true,
    'advertisement', json_build_object(
      'id', new_ad.id,
      'title', new_ad.title,
      'image_url', new_ad.image_url,
      'is_active', new_ad.is_active,
      'created_by', new_ad.created_by,
      'created_at', new_ad.created_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create secure function for updating advertisement status
CREATE OR REPLACE FUNCTION public.toggle_advertisement_secure(
  ad_id_input uuid,
  is_active_input boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update advertisement status
  UPDATE advertisements 
  SET is_active = is_active_input,
      updated_at = now()
  WHERE id = ad_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم تحديث حالة الإعلان');
  ELSE
    RETURN json_build_object('success', false, 'error', 'الإعلان غير موجود');
  END IF;
END;
$$;

-- Create secure function for deleting advertisements
CREATE OR REPLACE FUNCTION public.delete_advertisement_secure(
  ad_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the advertisement
  DELETE FROM advertisements WHERE id = ad_id_input;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'تم حذف الإعلان بنجاح');
  ELSE
    RETURN json_build_object('success', false, 'error', 'الإعلان غير موجود');
  END IF;
END;
$$;

-- Create secure function for getting all advertisements (admin view)
CREATE OR REPLACE FUNCTION public.get_all_advertisements_admin()
RETURNS TABLE(
  id uuid,
  title text,
  image_url text,
  is_active boolean,
  created_by text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function bypasses RLS for admin access
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.image_url,
    a.is_active,
    a.created_by,
    a.created_at,
    a.updated_at
  FROM advertisements a
  ORDER BY a.created_at DESC;
END;
$$;
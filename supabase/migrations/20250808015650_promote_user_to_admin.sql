-- Promote a specific user to admin role in profiles
-- Safe update: if profile exists, update; if not, insert
DO $$
DECLARE
  _uid uuid;
  _email text := lower('cleyton7silva@gmail.com');
  _has_profile boolean;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = _email LIMIT 1;

  -- If user not found, exit without error
  IF _uid IS NULL THEN
    RAISE NOTICE 'User with email % not found in auth.users. No changes made.', _email;
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid) INTO _has_profile;

  IF _has_profile THEN
    UPDATE public.profiles
      SET role = 'admin'::user_role,
          updated_at = now()
      WHERE user_id = _uid;
    RAISE NOTICE 'Updated existing profile for % to role=admin', _email;
  ELSE
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (
      _uid,
      split_part(_email, '@', 1),
      'admin'::user_role
    );
    RAISE NOTICE 'Inserted new profile for % with role=admin', _email;
  END IF;
END $$;
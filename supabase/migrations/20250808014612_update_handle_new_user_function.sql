-- Update handle_new_user to assign admin role for admin@esquads.dev and set profile fields
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _display_name text;
  _avatar_url text;
  _role user_role;
begin
  _display_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
  _avatar_url := new.raw_user_meta_data->>'avatar_url';
  _role := case when lower(new.email) = 'admin@esquads.dev' then 'admin'::user_role else 'student'::user_role end;

  insert into public.profiles (user_id, display_name, avatar_url, role)
  values (new.id, _display_name, _avatar_url, _role);

  return new;
end;
$$;

-- Backfill: if user already exists with admin email, ensure role is admin
update public.profiles p
set role = 'admin'::user_role,
    updated_at = now()
from auth.users u
where p.user_id = u.id
  and lower(u.email) = 'admin@esquads.dev';
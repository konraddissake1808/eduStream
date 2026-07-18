-- find_teacher_by_email did an exact-case match against auth.users.email,
-- but the caller lowercases its input before calling it -- if a teacher
-- signed up with any uppercase characters in their email, an institution
-- typing it back in (in whatever case) could fail to find them even
-- though the account exists. Compare both sides case-insensitively.
create or replace function public.find_teacher_by_email(lookup_email text)
returns table (id uuid, full_name text)
language sql
security definer
set search_path = public, auth
stable
as $$
  select p.id, p.full_name
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(lookup_email)
    and p.role = 'teacher'
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'institution'
    );
$$;

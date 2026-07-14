-- Lets an institution look up a teacher account by email without ever
-- exposing emails through a public/RLS-selectable column. Reads
-- auth.users directly (only possible because this function is
-- SECURITY DEFINER) and returns nothing but id/full_name. Also
-- self-gates to institution callers, as defense in depth alongside the
-- app-layer check.
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
  where u.email = lookup_email
    and p.role = 'teacher'
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'institution'
    );
$$;

revoke all on function public.find_teacher_by_email(text) from public;
grant execute on function public.find_teacher_by_email(text) to authenticated;

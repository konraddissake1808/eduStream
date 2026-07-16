-- Two gaps in institution support surfaced while building the institution
-- dashboard:
--
-- 1. is_institution_teammate() only recognized *member teachers* of an
--    institution, never the institution account itself. That meant an
--    institution couldn't see its own unpublished courses/playlists (or
--    manage their modules/lessons, or start/end live sessions on them)
--    unless it happened to also be the literal teacher_id — which isn't
--    the case for content authored by one of its member teachers.
--
-- 2. The enrollment select policy predates institutions entirely (it's
--    from the initial schema) and only checks course/playlist teacher_id,
--    with no institution branch at all — so institution-attributed
--    enrollments were invisible to the institution (and to teammate
--    teachers who didn't personally author the course/playlist).
create or replace function public.is_institution_teammate(target_institution_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_institution_id is not null and (
    target_institution_id = auth.uid()
    or exists (
      select 1 from public.institution_member im
      where im.institution_id = target_institution_id and im.teacher_id = auth.uid()
    )
  );
$$;

drop policy "Students and content owners can view relevant enrollments" on public.enrollment;
create policy "Students and content owners can view relevant enrollments"
  on public.enrollment for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.course c
      where c.id = enrollment.course_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
    or exists (
      select 1 from public.playlist p
      where p.id = enrollment.playlist_id
        and (p.teacher_id = auth.uid() or public.is_institution_teammate(p.institution_id))
    )
  );

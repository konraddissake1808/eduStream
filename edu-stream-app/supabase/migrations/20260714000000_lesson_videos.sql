-- Private bucket for lesson video files. All access (upload + signed
-- playback URLs) is mediated server-side via the service-role client,
-- gated by the existing course/module/playlist/lesson RLS checks, so no
-- storage.objects policies are needed here.
insert into storage.buckets (id, name, public)
values ('lesson-videos', 'lesson-videos', false)
on conflict (id) do nothing;

-- Shared by module/lesson (and could replace the duplicated checks in
-- course/playlist policies too, left as-is there to avoid touching
-- already-deployed policies unnecessarily).
create or replace function public.is_institution_teammate(target_institution_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_institution_id is not null and exists (
    select 1 from public.institution_member im
    where im.institution_id = target_institution_id and im.teacher_id = auth.uid()
  );
$$;

-- module: extend visibility/management to institution-member teachers.
drop policy "Modules are viewable with their course" on public.module;
create policy "Modules are viewable with their course"
  on public.module for select
  using (
    exists (
      select 1 from public.course c
      where c.id = module.course_id
        and (
          c.is_published
          or c.teacher_id = auth.uid()
          or public.is_institution_teammate(c.institution_id)
        )
    )
  );

drop policy "Teachers manage modules of their own courses" on public.module;
create policy "Teachers manage modules of their own courses"
  on public.module for all
  using (
    exists (
      select 1 from public.course c
      where c.id = module.course_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
  )
  with check (
    exists (
      select 1 from public.course c
      where c.id = module.course_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
  );

-- lesson: extend the owner branches (via module->course and via playlist)
-- to institution-member teachers. Preview/enrollment branches unchanged.
drop policy "Lessons are viewable by owners, enrolled students, or previews" on public.lesson;
create policy "Lessons are viewable by owners, enrolled students, or previews"
  on public.lesson for select
  using (
    is_preview
    or exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id
        and (p.teacher_id = auth.uid() or public.is_institution_teammate(p.institution_id))
    )
    or exists (
      select 1 from public.enrollment e
      join public.module m on m.course_id = e.course_id
      where m.id = lesson.module_id and e.student_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollment e
      where e.playlist_id = lesson.playlist_id and e.student_id = auth.uid()
    )
  );

drop policy "Teachers manage lessons in their own content" on public.lesson;
create policy "Teachers manage lessons in their own content"
  on public.lesson for all
  using (
    exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id
        and (p.teacher_id = auth.uid() or public.is_institution_teammate(p.institution_id))
    )
  )
  with check (
    exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id
        and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id
        and (p.teacher_id = auth.uid() or public.is_institution_teammate(p.institution_id))
    )
  );

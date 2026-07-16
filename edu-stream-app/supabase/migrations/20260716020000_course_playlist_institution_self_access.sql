-- The course/playlist RLS policies from the institutions migration predate
-- is_institution_teammate() (added a migration later) and inline their own
-- copy of the membership check instead of calling it. That means the fix
-- in 20260716010000_institution_own_content_visibility.sql — broadening
-- is_institution_teammate() to also recognize the institution acting as
-- itself — never reached these 8 policies, so an institution still
-- couldn't see/manage its own unpublished courses/playlists authored by a
-- member teacher. Replacing the inlined checks with calls to the shared
-- function fixes that and removes the duplication.
drop policy "Published courses are viewable by everyone" on public.course;
create policy "Published courses are viewable by everyone"
  on public.course for select
  using (
    is_published
    or teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

drop policy "Teachers can insert their own or their institution's courses" on public.course;
create policy "Teachers can insert their own or their institution's courses"
  on public.course for insert
  with check (
    teacher_id = auth.uid()
    and (institution_id is null or public.is_institution_teammate(institution_id))
  );

drop policy "Teachers can update their own or their institution's courses" on public.course;
create policy "Teachers can update their own or their institution's courses"
  on public.course for update
  using (
    teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

drop policy "Teachers can delete their own or their institution's courses" on public.course;
create policy "Teachers can delete their own or their institution's courses"
  on public.course for delete
  using (
    teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

drop policy "Published playlists are viewable by everyone" on public.playlist;
create policy "Published playlists are viewable by everyone"
  on public.playlist for select
  using (
    is_published
    or teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

drop policy "Teachers can insert their own or their institution's playlists" on public.playlist;
create policy "Teachers can insert their own or their institution's playlists"
  on public.playlist for insert
  with check (
    teacher_id = auth.uid()
    and (institution_id is null or public.is_institution_teammate(institution_id))
  );

drop policy "Teachers can update their own or their institution's playlists" on public.playlist;
create policy "Teachers can update their own or their institution's playlists"
  on public.playlist for update
  using (
    teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

drop policy "Teachers can delete their own or their institution's playlists" on public.playlist;
create policy "Teachers can delete their own or their institution's playlists"
  on public.playlist for delete
  using (
    teacher_id = auth.uid()
    or public.is_institution_teammate(institution_id)
  );

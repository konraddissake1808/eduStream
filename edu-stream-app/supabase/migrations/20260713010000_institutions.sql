-- institution_member links teacher accounts to institution accounts.
-- Either side can create the link: an institution adding a known teacher,
-- or a teacher joining a public institution profile. Whichever side is
-- acting must authenticate as themselves and assert the other party's role.
create table public.institution_member (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (institution_id, teacher_id)
);

create index institution_member_institution_id_idx on public.institution_member (institution_id);
create index institution_member_teacher_id_idx on public.institution_member (teacher_id);

alter table public.institution_member enable row level security;

create policy "Institution members are viewable by the institution or the teacher"
  on public.institution_member for select
  using (institution_id = auth.uid() or teacher_id = auth.uid());

create policy "Institutions or teachers can create a membership link"
  on public.institution_member for insert
  with check (
    (
      institution_id = auth.uid()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'institution')
      and exists (select 1 from public.profiles p where p.id = teacher_id and p.role = 'teacher')
    )
    or
    (
      teacher_id = auth.uid()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
      and exists (select 1 from public.profiles p where p.id = institution_id and p.role = 'institution')
    )
  );

create policy "Institutions or the member teacher can end a membership"
  on public.institution_member for delete
  using (institution_id = auth.uid() or teacher_id = auth.uid());

-- course/playlist can optionally be attributed to an institution, so any of
-- its member teachers can manage it, not just the original author.
alter table public.course add column institution_id uuid references public.profiles (id) on delete set null;
alter table public.playlist add column institution_id uuid references public.profiles (id) on delete set null;

create index course_institution_id_idx on public.course (institution_id);
create index playlist_institution_id_idx on public.playlist (institution_id);

-- Replace course policies to also allow institution-member teachers.
drop policy "Published courses are viewable by everyone" on public.course;
create policy "Published courses are viewable by everyone"
  on public.course for select
  using (
    is_published
    or teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = course.institution_id and im.teacher_id = auth.uid()
    ))
  );

drop policy "Teachers can insert their own courses" on public.course;
create policy "Teachers can insert their own or their institution's courses"
  on public.course for insert
  with check (
    teacher_id = auth.uid()
    and (
      institution_id is null
      or exists (
        select 1 from public.institution_member im
        where im.institution_id = course.institution_id and im.teacher_id = auth.uid()
      )
    )
  );

drop policy "Teachers can update their own courses" on public.course;
create policy "Teachers can update their own or their institution's courses"
  on public.course for update
  using (
    teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = course.institution_id and im.teacher_id = auth.uid()
    ))
  );

drop policy "Teachers can delete their own courses" on public.course;
create policy "Teachers can delete their own or their institution's courses"
  on public.course for delete
  using (
    teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = course.institution_id and im.teacher_id = auth.uid()
    ))
  );

-- Mirror the same changes for playlist.
drop policy "Published playlists are viewable by everyone" on public.playlist;
create policy "Published playlists are viewable by everyone"
  on public.playlist for select
  using (
    is_published
    or teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = playlist.institution_id and im.teacher_id = auth.uid()
    ))
  );

drop policy "Teachers can insert their own playlists" on public.playlist;
create policy "Teachers can insert their own or their institution's playlists"
  on public.playlist for insert
  with check (
    teacher_id = auth.uid()
    and (
      institution_id is null
      or exists (
        select 1 from public.institution_member im
        where im.institution_id = playlist.institution_id and im.teacher_id = auth.uid()
      )
    )
  );

drop policy "Teachers can update their own playlists" on public.playlist;
create policy "Teachers can update their own or their institution's playlists"
  on public.playlist for update
  using (
    teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = playlist.institution_id and im.teacher_id = auth.uid()
    ))
  );

drop policy "Teachers can delete their own playlists" on public.playlist;
create policy "Teachers can delete their own or their institution's playlists"
  on public.playlist for delete
  using (
    teacher_id = auth.uid()
    or (institution_id is not null and exists (
      select 1 from public.institution_member im
      where im.institution_id = playlist.institution_id and im.teacher_id = auth.uid()
    ))
  );

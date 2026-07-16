-- Live video sessions, hosted by a teacher/institution, tied to exactly
-- one of {course, playlist} for access control (same "who can see this"
-- shape as lesson: owner/institution teammate, or an enrolled student).
-- Room membership/media itself is handled by LiveKit; this table is just
-- the record of who's allowed in and whether it's currently live.
create table public.live_session (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.course (id) on delete cascade,
  playlist_id uuid references public.playlist (id) on delete cascade,
  institution_id uuid references public.profiles (id) on delete set null,
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  room_name text not null unique,
  status text not null default 'live' check (status in ('live', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint live_session_single_parent check (num_nonnulls(course_id, playlist_id) = 1)
);

create index live_session_course_id_idx on public.live_session (course_id);
create index live_session_playlist_id_idx on public.live_session (playlist_id);
create index live_session_host_id_idx on public.live_session (host_id);

alter table public.live_session enable row level security;

create policy "Live sessions are viewable by host, institution, or enrolled students"
  on public.live_session for select
  using (
    host_id = auth.uid()
    or public.is_institution_teammate(institution_id)
    or exists (
      select 1 from public.enrollment e
      where (e.course_id = live_session.course_id or e.playlist_id = live_session.playlist_id)
        and e.student_id = auth.uid()
    )
  );

create policy "Teachers can start sessions for their own or institution content"
  on public.live_session for insert
  with check (
    host_id = auth.uid()
    and (institution_id is null or public.is_institution_teammate(institution_id))
    and (
      course_id is null
      or exists (
        select 1 from public.course c
        where c.id = live_session.course_id
          and (c.teacher_id = auth.uid() or public.is_institution_teammate(c.institution_id))
      )
    )
    and (
      playlist_id is null
      or exists (
        select 1 from public.playlist p
        where p.id = live_session.playlist_id
          and (p.teacher_id = auth.uid() or public.is_institution_teammate(p.institution_id))
      )
    )
  );

create policy "Hosts and institution teammates can end a session"
  on public.live_session for update
  using (host_id = auth.uid() or public.is_institution_teammate(institution_id))
  with check (host_id = auth.uid() or public.is_institution_teammate(institution_id));

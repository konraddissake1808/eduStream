-- eduStream initial schema
-- Content model: course -> module -> lesson (structured)
--                playlist -> lesson (flat, no modules)
-- A lesson belongs to exactly one of {module, playlist}.
-- An enrollment targets exactly one of {course, playlist}.

create extension if not exists "pgcrypto" with schema extensions;

create type public.user_role as enum ('teacher', 'student');
create type public.enrollment_status as enum ('active', 'completed', 'cancelled');

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users; role determines teacher vs student)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- Role/full_name can be passed in via signUp's `options.data`.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student')::public.user_role,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- category
-- ---------------------------------------------------------------------------
create table public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- course (structured: course -> module -> lesson)
-- ---------------------------------------------------------------------------
create table public.course (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.category (id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  price numeric(10, 2) not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_teacher_id_idx on public.course (teacher_id);
create index course_category_id_idx on public.course (category_id);

-- ---------------------------------------------------------------------------
-- playlist (flat: playlist -> lesson, no modules)
-- ---------------------------------------------------------------------------
create table public.playlist (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.category (id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  price numeric(10, 2) not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index playlist_teacher_id_idx on public.playlist (teacher_id);
create index playlist_category_id_idx on public.playlist (category_id);

-- ---------------------------------------------------------------------------
-- module (belongs to a course)
-- ---------------------------------------------------------------------------
create table public.module (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create index module_course_id_idx on public.module (course_id);

-- ---------------------------------------------------------------------------
-- lesson (belongs to exactly one of module or playlist)
-- ---------------------------------------------------------------------------
create table public.lesson (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.module (id) on delete cascade,
  playlist_id uuid references public.playlist (id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  duration_seconds integer,
  position integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now(),
  constraint lesson_single_parent check (num_nonnulls(module_id, playlist_id) = 1)
);

create index lesson_module_id_idx on public.lesson (module_id);
create index lesson_playlist_id_idx on public.lesson (playlist_id);
create unique index lesson_module_position_key on public.lesson (module_id, position) where module_id is not null;
create unique index lesson_playlist_position_key on public.lesson (playlist_id, position) where playlist_id is not null;

-- ---------------------------------------------------------------------------
-- enrollment (student enrolls in exactly one of course or playlist)
-- ---------------------------------------------------------------------------
create table public.enrollment (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.course (id) on delete cascade,
  playlist_id uuid references public.playlist (id) on delete cascade,
  status public.enrollment_status not null default 'active',
  amount_paid numeric(10, 2) not null default 0,
  enrolled_at timestamptz not null default now(),
  constraint enrollment_single_target check (num_nonnulls(course_id, playlist_id) = 1)
);

create index enrollment_student_id_idx on public.enrollment (student_id);
create unique index enrollment_student_course_key on public.enrollment (student_id, course_id) where course_id is not null;
create unique index enrollment_student_playlist_key on public.enrollment (student_id, playlist_id) where playlist_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_course_updated_at before update on public.course
  for each row execute function public.set_updated_at();
create trigger set_playlist_updated_at before update on public.playlist
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.category enable row level security;
alter table public.course enable row level security;
alter table public.playlist enable row level security;
alter table public.module enable row level security;
alter table public.lesson enable row level security;
alter table public.enrollment enable row level security;

-- profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- category (managed via service role / dashboard, not client writes)
create policy "Categories are viewable by everyone"
  on public.category for select
  using (true);

-- course
create policy "Published courses are viewable by everyone"
  on public.course for select
  using (is_published or teacher_id = auth.uid());

create policy "Teachers can insert their own courses"
  on public.course for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own courses"
  on public.course for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own courses"
  on public.course for delete
  using (teacher_id = auth.uid());

-- playlist
create policy "Published playlists are viewable by everyone"
  on public.playlist for select
  using (is_published or teacher_id = auth.uid());

create policy "Teachers can insert their own playlists"
  on public.playlist for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own playlists"
  on public.playlist for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own playlists"
  on public.playlist for delete
  using (teacher_id = auth.uid());

-- module (inherits visibility/ownership from its course)
create policy "Modules are viewable with their course"
  on public.module for select
  using (
    exists (
      select 1 from public.course c
      where c.id = module.course_id
        and (c.is_published or c.teacher_id = auth.uid())
    )
  );

create policy "Teachers manage modules of their own courses"
  on public.module for all
  using (
    exists (
      select 1 from public.course c
      where c.id = module.course_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.course c
      where c.id = module.course_id and c.teacher_id = auth.uid()
    )
  );

-- lesson (viewable if preview, owned, or enrolled)
create policy "Lessons are viewable by owners, enrolled students, or previews"
  on public.lesson for select
  using (
    is_preview
    or exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id and c.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id and p.teacher_id = auth.uid()
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

create policy "Teachers manage lessons in their own content"
  on public.lesson for all
  using (
    exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id and c.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id and p.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.module m
      join public.course c on c.id = m.course_id
      where m.id = lesson.module_id and c.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.playlist p
      where p.id = lesson.playlist_id and p.teacher_id = auth.uid()
    )
  );

-- enrollment
create policy "Students and content owners can view relevant enrollments"
  on public.enrollment for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.course c
      where c.id = enrollment.course_id and c.teacher_id = auth.uid()
    )
    or exists (
      select 1 from public.playlist p
      where p.id = enrollment.playlist_id and p.teacher_id = auth.uid()
    )
  );

create policy "Students can enroll themselves"
  on public.enrollment for insert
  with check (student_id = auth.uid());

create policy "Students can update their own enrollments"
  on public.enrollment for update
  using (student_id = auth.uid());

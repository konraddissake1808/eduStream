-- Notifications for real events: a teacher gets notified when someone
-- enrolls in their course/playlist, and enrolled students get notified
-- when a live session they have access to starts. All inserts happen
-- server-side via the service-role client (system-triggered, not a user
-- action), so there's no insert policy — only the recipient can read or
-- mark their own notifications.
create table public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('enrollment', 'live_session_started')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notification_user_id_created_at_idx
  on public.notification (user_id, created_at desc);

alter table public.notification enable row level security;

create policy "Users can view their own notifications"
  on public.notification for select
  using (user_id = auth.uid());

create policy "Users can mark their own notifications read"
  on public.notification for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

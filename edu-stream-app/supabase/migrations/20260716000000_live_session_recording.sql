-- Track LiveKit Egress recording of a live session, so it can be played
-- back afterward the same way a lesson video is (signed URL against a
-- private bucket, service-role mediated). status starts 'none' and only
-- ever becomes 'recording' if the host's session actually started an
-- egress (best-effort — a session still works if egress fails to start).
alter table public.live_session
  add column egress_id text,
  add column recording_status text not null default 'none'
    check (recording_status in ('none', 'recording', 'processing', 'ready', 'failed')),
  add column recording_path text;

-- Private bucket for session recordings, uploaded directly by LiveKit
-- Egress via Supabase's S3-compatible endpoint. Same access model as
-- lesson-videos: no storage.objects policies, playback is via signed URLs
-- issued server-side after the existing live_session RLS check passes.
insert into storage.buckets (id, name, public)
values ('live-recordings', 'live-recordings', false)
on conflict (id) do nothing;

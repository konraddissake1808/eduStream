-- Institutions are a third account type: an organization that can have
-- multiple teacher accounts collaborating on its courses/playlists.
-- This must be its own migration: a new enum value cannot be referenced
-- in the same transaction that adds it.
alter type public.user_role add value 'institution';

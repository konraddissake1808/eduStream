-- Make the lesson-videos bucket's size limit explicit in code rather than
-- silently inheriting the project's dashboard-configured Storage default
-- (currently 50MB on the free plan). If the plan/limit ever changes,
-- update this value (and next.config.ts's serverActions.bodySizeLimit,
-- and the client-side check in the lesson upload forms) together.
update storage.buckets
set file_size_limit = 52428800 -- 50MB
where id = 'lesson-videos';

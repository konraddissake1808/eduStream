import { createAdminClient } from "@/lib/supabase/admin";

const RECORDING_BUCKET = "live-recordings";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, plenty for one viewing session

// live_session.recording_path holds a path within the live-recordings
// bucket. Resolve it into a short-lived signed URL for playback, the same
// way lesson videos are served.
export async function resolveRecordingUrl(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(RECORDING_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

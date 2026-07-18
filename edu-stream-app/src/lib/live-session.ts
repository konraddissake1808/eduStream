import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkRecordingCompletion,
  isRecordingConfigured,
  startSessionRecording,
  stopSessionRecording,
} from "@/lib/livekit";

// Best-effort: a session should still start/end fine even if recording
// fails to start or stop, so failures here are swallowed rather than
// surfaced to the host.
export async function tryStartRecording(sessionId: string, roomName: string) {
  if (!isRecordingConfigured()) return;

  try {
    const recordingPath = `${sessionId}.mp4`;
    const egressId = await startSessionRecording(roomName, recordingPath);

    const supabase = await createClient();
    await supabase
      .from("live_session")
      .update({
        egress_id: egressId,
        recording_status: "recording",
        recording_path: recordingPath,
      })
      .eq("id", sessionId);
  } catch {
    // Recording didn't start; the session proceeds without one.
  }
}

export async function tryStopRecording(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("live_session")
    .select("egress_id, recording_status")
    .eq("id", sessionId)
    .single();

  if (!session?.egress_id || session.recording_status !== "recording") return;

  try {
    await stopSessionRecording(session.egress_id);
    await supabase
      .from("live_session")
      .update({ recording_status: "processing" })
      .eq("id", sessionId);
  } catch {
    // Egress will still finish and upload on LiveKit's side; the next
    // reconciliation check will just find it already complete.
  }
}

// Egress finalizes asynchronously after stopEgress returns, so completion
// is reconciled lazily on view rather than via a webhook. Written with the
// admin client because any authorized viewer (not just the host) can be
// the one to trigger this, and only the host/institution can UPDATE
// live_session under RLS.
export async function reconcileRecordingStatus(
  sessionId: string,
  egressId: string
) {
  const resolved = await checkRecordingCompletion(egressId);
  if (resolved === "processing") return resolved;

  const admin = createAdminClient();
  await admin
    .from("live_session")
    .update({ recording_status: resolved })
    .eq("id", sessionId);

  return resolved;
}

// Every page that lists finished recordings (course/playlist content pages,
// the live hub, dashboards) filters on recording_status = 'ready', but that
// column only ever updates via reconcileRecordingStatus, which used to run
// solely on the single session's own /live/[id] page. A recording could
// finish processing on LiveKit's side and just sit at 'processing' forever
// if nobody happened to open that exact URL. Call this before any such
// listing query so it self-heals instead. Written with the admin client:
// this is a safe, idempotent sync against LiveKit's own egress status, not
// something that needs to respect the caller's RLS visibility.
export async function reconcilePendingRecordings({
  courseIds = [],
  playlistIds = [],
}: {
  courseIds?: string[];
  playlistIds?: string[];
}) {
  const filterParts = [
    courseIds.length ? `course_id.in.(${courseIds.join(",")})` : null,
    playlistIds.length ? `playlist_id.in.(${playlistIds.join(",")})` : null,
  ].filter((part): part is string => part !== null);

  if (filterParts.length === 0) return;

  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("live_session")
    .select("id, egress_id")
    .or(filterParts.join(","))
    .eq("status", "ended")
    .eq("recording_status", "processing")
    .not("egress_id", "is", null);

  if (!pending?.length) return;

  await Promise.all(
    pending.map((session) =>
      reconcileRecordingStatus(session.id, session.egress_id as string)
    )
  );
}

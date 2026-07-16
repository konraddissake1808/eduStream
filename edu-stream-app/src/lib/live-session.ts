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

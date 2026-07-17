import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";
import { reconcileRecordingStatus } from "@/lib/live-session";
import { resolveRecordingUrl } from "@/lib/recordings";
import { LiveRoomClient } from "./live-room";
import { ProcessingIndicator } from "./processing-indicator";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const profile = await requireProfile(`/live/${sessionId}`);

  const supabase = await createClient();

  // RLS restricts this to the host, an institution teammate, or an
  // enrolled student.
  const { data: session } = await supabase
    .from("live_session")
    .select(
      "id, title, status, host_id, egress_id, recording_status, recording_path"
    )
    .eq("id", sessionId)
    .single();

  if (!session) {
    notFound();
  }

  if (session.status === "ended") {
    let recordingStatus = session.recording_status;

    if (recordingStatus === "processing" && session.egress_id) {
      recordingStatus = await reconcileRecordingStatus(
        session.id,
        session.egress_id
      );
    }

    const recordingUrl =
      recordingStatus === "ready" && session.recording_path
        ? await resolveRecordingUrl(session.recording_path)
        : null;

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">{session.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This session has ended.
        </p>

        {recordingUrl && (
          <video
            controls
            src={recordingUrl}
            className="mt-6 w-full rounded-lg border border-neutral-200"
          />
        )}
        {recordingStatus === "processing" && <ProcessingIndicator />}
        {recordingStatus === "failed" && (
          <p className="mt-6 text-sm text-red-600">
            This recording failed to process and isn&apos;t available.
          </p>
        )}
      </div>
    );
  }

  return (
    <LiveRoomClient
      sessionId={session.id}
      title={session.title}
      isHost={session.host_id === profile.id}
      isRecording={session.recording_status === "recording"}
    />
  );
}

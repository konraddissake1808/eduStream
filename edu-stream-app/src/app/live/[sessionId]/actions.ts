"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";
import { createLiveKitToken } from "@/lib/livekit";
import { tryStopRecording } from "@/lib/live-session";

export async function getLiveSessionToken(sessionId: string) {
  const profile = await requireProfile(`/live/${sessionId}`);
  const supabase = await createClient();

  // RLS restricts this to the host, an institution teammate, or an
  // enrolled student — if it comes back, joining is authorized.
  const { data: session } = await supabase
    .from("live_session")
    .select("id, room_name, status, host_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    throw new Error("Session not found.");
  }

  if (session.status === "ended") {
    throw new Error("This session has ended.");
  }

  const isHost = session.host_id === profile.id;

  const token = await createLiveKitToken({
    roomName: session.room_name,
    identity: profile.id,
    name: profile.full_name ?? "Guest",
    canPublish: isHost,
  });

  return { token, isHost };
}

export async function endLiveSession(sessionId: string) {
  await requireProfile(`/live/${sessionId}`);
  const supabase = await createClient();

  // RLS restricts this update to the host or an institution teammate.
  const { error } = await supabase
    .from("live_session")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  await tryStopRecording(sessionId);

  revalidatePath(`/live/${sessionId}`);
}

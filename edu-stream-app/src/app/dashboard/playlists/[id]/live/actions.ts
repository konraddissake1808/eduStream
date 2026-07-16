"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { newRoomName } from "@/lib/livekit";
import { tryStartRecording } from "@/lib/live-session";

export type StartSessionState = { error: string } | undefined;

export async function startLiveSession(
  playlistId: string,
  _prevState: StartSessionState,
  formData: FormData
): Promise<StartSessionState> {
  const creator = await requireContentCreator(
    `/dashboard/playlists/${playlistId}/live`
  );

  const title = formData.get("title");
  const institutionIdRaw = formData.get("institutionId");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required." };
  }

  const institutionId =
    creator.role === "institution"
      ? creator.id
      : typeof institutionIdRaw === "string" && institutionIdRaw
        ? institutionIdRaw
        : null;

  const roomName = newRoomName();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("live_session")
    .insert({
      playlist_id: playlistId,
      institution_id: institutionId,
      host_id: creator.id,
      title: title.trim(),
      room_name: roomName,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to start session." };
  }

  await tryStartRecording(data.id, roomName);

  redirect(`/live/${data.id}`);
}

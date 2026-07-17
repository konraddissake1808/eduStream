"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";

export type EnrollState = { error: string } | { success: true } | undefined;

export async function enrollInPlaylist(
  playlistId: string,
  _prevState: EnrollState,
  _formData: FormData
): Promise<EnrollState> {
  const profile = await requireProfile(`/playlists/${playlistId}`);

  const supabase = await createClient();

  // Re-check the playlist server-side rather than trusting the client.
  const { data: playlist, error: playlistError } = await supabase
    .from("playlist")
    .select("id, price, is_published")
    .eq("id", playlistId)
    .single();

  if (playlistError || !playlist || !playlist.is_published) {
    return { error: "Playlist not found." };
  }

  if (playlist.price > 0) {
    return { error: "Paid enrollment isn't available yet." };
  }

  const { error } = await supabase.from("enrollment").insert({
    student_id: profile.id,
    playlist_id: playlistId,
    amount_paid: 0,
  });

  // 23505 = unique violation, i.e. already enrolled: treat as a no-op.
  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  // Deliberately not calling revalidatePath here: it would refresh the
  // parent page's server-rendered "already enrolled" branch immediately,
  // unmounting this button before its own success confirmation ever
  // gets to paint. The DB write already happened, so a later reload
  // reflects it correctly regardless.
  return { success: true };
}

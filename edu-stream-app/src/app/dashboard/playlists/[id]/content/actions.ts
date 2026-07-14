"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { uploadLessonVideo, deleteLessonVideo } from "@/lib/video";

export type LessonFormState = { error: string } | undefined;

export async function createLesson(
  playlistId: string,
  _prevState: LessonFormState,
  formData: FormData
): Promise<LessonFormState> {
  await requireContentCreator(`/dashboard/playlists/${playlistId}/content`);

  const title = formData.get("title");
  const description = formData.get("description");
  const isPreview = formData.get("isPreview") === "on";
  const video = formData.get("video");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required." };
  }

  if (!(video instanceof File) || video.size === 0) {
    return { error: "A video file is required." };
  }

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("lesson")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let videoPath: string;
  try {
    videoPath = await uploadLessonVideo(video, `playlist/${playlistId}`);
  } catch (uploadError) {
    return {
      error:
        uploadError instanceof Error
          ? uploadError.message
          : "Video upload failed.",
    };
  }

  const { error } = await supabase.from("lesson").insert({
    playlist_id: playlistId,
    title: title.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    video_url: videoPath,
    is_preview: isPreview,
    position: (last?.position ?? -1) + 1,
  });

  if (error) {
    await deleteLessonVideo(videoPath);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/playlists/${playlistId}/content`);
}

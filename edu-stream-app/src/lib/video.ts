import { createAdminClient } from "@/lib/supabase/admin";

const LESSON_VIDEO_BUCKET = "lesson-videos";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, plenty for one viewing session

export async function uploadLessonVideo(file: File, pathPrefix: string) {
  const admin = createAdminClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "mp4";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;

  const { error } = await admin.storage
    .from(LESSON_VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type || "video/mp4" });

  if (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }

  return path;
}

// Best-effort cleanup for when the upload succeeds but the lesson insert
// that references it fails (e.g. an RLS rejection).
export async function deleteLessonVideo(path: string) {
  const admin = createAdminClient();
  await admin.storage.from(LESSON_VIDEO_BUCKET).remove([path]);
}

// lesson.video_url holds either a full external URL (YouTube, Vimeo, a
// direct link, ...) or a path within the lesson-videos bucket. Resolve the
// latter into a short-lived signed URL for playback.
export async function resolveLessonVideoUrl(videoUrl: string) {
  if (/^https?:\/\//i.test(videoUrl)) {
    return videoUrl;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(LESSON_VIDEO_BUCKET)
    .createSignedUrl(videoUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

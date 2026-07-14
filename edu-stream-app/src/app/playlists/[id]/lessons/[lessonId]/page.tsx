import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveLessonVideoUrl } from "@/lib/video";

type LessonDetail = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  playlist_id: string | null;
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const supabase = await createClient();

  // RLS gates this exactly the same as visibility in the lesson list
  // (preview, enrolled, or owner/institution): if it comes back, it's
  // playable.
  const { data } = await supabase
    .from("lesson")
    .select("id, title, description, video_url, playlist_id")
    .eq("id", lessonId)
    .single();

  const lesson = data as unknown as LessonDetail | null;

  if (!lesson || lesson.playlist_id !== id) {
    notFound();
  }

  const videoUrl = await resolveLessonVideoUrl(lesson.video_url);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href={`/playlists/${id}`} className="text-sm text-neutral-500 underline">
        &larr; Back to playlist
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{lesson.title}</h1>

      {videoUrl ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          controls
          src={videoUrl}
          className="mt-4 w-full rounded-lg bg-black"
        />
      ) : (
        <p className="mt-4 text-sm text-red-600">
          This video isn&apos;t available right now.
        </p>
      )}

      {lesson.description && (
        <p className="mt-4 whitespace-pre-line text-sm text-neutral-700">
          {lesson.description}
        </p>
      )}
    </div>
  );
}

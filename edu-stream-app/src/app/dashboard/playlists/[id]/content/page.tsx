import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { AddLessonForm } from "./add-lesson-form";

type LessonRow = {
  id: string;
  title: string;
  is_preview: boolean;
};

export default async function PlaylistContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/playlists/${id}/content`);

  const supabase = await createClient();

  // No app-level ownership filter: RLS already limits this to the
  // playlist's own teacher or a fellow institution-member teacher.
  const { data: playlist } = await supabase
    .from("playlist")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!playlist) {
    notFound();
  }

  const { data } = await supabase
    .from("lesson")
    .select("id, title, is_preview")
    .eq("playlist_id", id)
    .order("position");

  const lessons = (data ?? []) as unknown as LessonRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">Lessons</p>

      {lessons.length > 0 && (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm">{lesson.title}</span>
              {lesson.is_preview && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  Preview
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Add lesson</h2>
        <AddLessonForm playlistId={playlist.id} />
      </div>
    </div>
  );
}

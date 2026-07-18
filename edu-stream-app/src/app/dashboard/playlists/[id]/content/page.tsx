import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { reconcilePendingRecordings } from "@/lib/live-session";
import { AddLessonForm } from "./add-lesson-form";

type LessonRow = {
  id: string;
  title: string;
  is_preview: boolean;
};

type PastLiveStreamRow = {
  id: string;
  title: string;
  ended_at: string | null;
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

  await reconcilePendingRecordings({ playlistIds: [id] });

  const { data: pastLiveStreamRows } = await supabase
    .from("live_session")
    .select("id, title, ended_at")
    .eq("playlist_id", id)
    .eq("status", "ended")
    .eq("recording_status", "ready")
    .order("ended_at", { ascending: false });

  const pastLiveStreams = (pastLiveStreamRows ?? []) as PastLiveStreamRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">Lessons</p>

      {lessons.length > 0 ? (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm">{lesson.title}</span>
              <div className="flex items-center gap-2">
                {lesson.is_preview && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    Preview
                  </span>
                )}
                <Link
                  href={`/playlists/${playlist.id}/lessons/${lesson.id}`}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <Play className="h-3 w-3" />
                  Watch
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-neutral-500">
          No video published yet.
        </p>
      )}

      <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Add lesson
        </h3>
        <div className="mt-3">
          <AddLessonForm playlistId={playlist.id} />
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Past live streams</h2>
        {pastLiveStreams.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No recorded live streams yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {pastLiveStreams.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm">{session.title}</p>
                  {session.ended_at && (
                    <p className="text-xs text-neutral-500">
                      {new Date(session.ended_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link
                  href={`/live/${session.id}`}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <Play className="h-3 w-3" />
                  Watch
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

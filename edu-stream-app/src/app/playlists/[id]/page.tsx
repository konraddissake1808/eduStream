import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { EnrollButton } from "./enroll-button";

type PlaylistDetail = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  teacher_id: string;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

type LessonRow = { id: string; title: string; is_preview: boolean };

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("playlist")
    .select(
      "id, title, description, price, teacher_id, category(name), teacher:profiles!playlist_teacher_id_fkey(full_name)"
    )
    .eq("id", id)
    .single();

  const playlist = data as unknown as PlaylistDetail | null;

  if (!playlist) {
    notFound();
  }

  const profile = await getProfile();
  const isOwner = profile?.id === playlist.teacher_id;

  let isEnrolled = false;
  if (profile && !isOwner) {
    const { data: enrollment } = await supabase
      .from("enrollment")
      .select("id")
      .eq("playlist_id", playlist.id)
      .eq("student_id", profile.id)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  // RLS only returns lessons this viewer can actually see (previews,
  // enrolled students, or the owner/institution), so this list is safe
  // to render as-is with no extra filtering.
  const { data: lessonData } = await supabase
    .from("lesson")
    .select("id, title, is_preview")
    .eq("playlist_id", playlist.id)
    .order("position");

  const lessons = (lessonData ?? []) as unknown as LessonRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {playlist.category?.name ?? "Uncategorized"}
        {playlist.teacher?.full_name
          ? ` · by ${playlist.teacher.full_name}`
          : ""}
        {" · "}
        {playlist.price > 0 ? `$${playlist.price}` : "Free"}
      </p>

      {playlist.description && (
        <p className="mt-6 whitespace-pre-line text-sm text-neutral-700">
          {playlist.description}
        </p>
      )}

      {lessons.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold">Lessons</h2>
          <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <Link
                  href={`/playlists/${playlist.id}/lessons/${lesson.id}`}
                  className="text-sm underline"
                >
                  {lesson.title}
                </Link>
                {lesson.is_preview && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    Preview
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        {isOwner ? (
          <p className="text-sm text-neutral-500">This is your playlist.</p>
        ) : isEnrolled ? (
          <p className="text-sm font-medium text-green-700">
            You&apos;re enrolled in this playlist.
          </p>
        ) : !profile ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/playlists/${playlist.id}`)}`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Log in to enroll
          </Link>
        ) : playlist.price > 0 ? (
          <p className="text-sm text-neutral-500">
            Paid enrollment isn&apos;t available yet.
          </p>
        ) : (
          <EnrollButton playlistId={playlist.id} />
        )}
      </div>
    </div>
  );
}

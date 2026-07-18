import Link from "next/link";
import { Radio, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  requireContentCreator,
  getMyInstitutionMemberships,
} from "@/lib/supabase/dal";
import { reconcilePendingRecordings } from "@/lib/live-session";

type ContentRow = { id: string; title: string };

type SessionRow = {
  id: string;
  title: string;
  status: string;
  started_at: string;
  recording_status: string;
  course: { title: string } | null;
  playlist: { title: string } | null;
};

export default async function LiveSessionsHubPage() {
  const creator = await requireContentCreator("/dashboard/live");
  const supabase = await createClient();

  // Same ownership rule as the courses/playlists lists: content this
  // account authored directly, plus anything attributed to an
  // institution it's part of.
  const institutionIds =
    creator.role === "institution"
      ? [creator.id]
      : (await getMyInstitutionMemberships()).map((m) => m.institution.id);

  const orFilter = institutionIds.length
    ? `teacher_id.eq.${creator.id},institution_id.in.(${institutionIds.join(",")})`
    : `teacher_id.eq.${creator.id}`;

  const [{ data: courseRows }, { data: playlistRows }] = await Promise.all([
    supabase
      .from("course")
      .select("id, title")
      .or(orFilter)
      .order("created_at", { ascending: false }),
    supabase
      .from("playlist")
      .select("id, title")
      .or(orFilter)
      .order("created_at", { ascending: false }),
  ]);

  const courses = (courseRows ?? []) as ContentRow[];
  const playlists = (playlistRows ?? []) as ContentRow[];

  const courseIds = courses.map((c) => c.id);
  const playlistIds = playlists.map((p) => p.id);

  let sessions: SessionRow[] = [];
  if (courseIds.length || playlistIds.length) {
    await reconcilePendingRecordings({ courseIds, playlistIds });

    const filterParts = [];
    if (courseIds.length) filterParts.push(`course_id.in.(${courseIds.join(",")})`);
    if (playlistIds.length) filterParts.push(`playlist_id.in.(${playlistIds.join(",")})`);

    const { data: sessionRows } = await supabase
      .from("live_session")
      .select(
        "id, title, status, started_at, recording_status, course(title), playlist(title)"
      )
      .or(filterParts.join(","))
      .order("started_at", { ascending: false })
      .limit(10);

    sessions = (sessionRows ?? []) as unknown as SessionRow[];
  }

  const liveNow = sessions.filter((s) => s.status === "live");
  const recordings = sessions.filter(
    (s) => s.status === "ended" && s.recording_status === "ready"
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Live Sessions</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick a course or playlist to start (or manage) a live session for it.
      </p>

      {courses.length === 0 && playlists.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          You haven&apos;t created any courses or playlists yet.{" "}
          <Link
            href="/dashboard/courses/new"
            className="font-medium text-indigo-600 underline"
          >
            Create your first course
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {liveNow.length > 0 && (
            <SessionSection title="Live now" sessions={liveNow} live />
          )}
          {recordings.length > 0 && (
            <SessionSection title="Recent recordings" sessions={recordings} />
          )}
          {courses.length > 0 && (
            <ContentSection
              title="Courses"
              items={courses}
              hrefFor={(id) => `/dashboard/courses/${id}/live`}
            />
          )}
          {playlists.length > 0 && (
            <ContentSection
              title="Playlists"
              items={playlists}
              hrefFor={(id) => `/dashboard/playlists/${id}/live`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SessionSection({
  title,
  sessions,
  live,
}: {
  title: string;
  sessions: SessionRow[];
  live?: boolean;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{session.title}</p>
              <p className="text-xs text-neutral-500">
                {session.course?.title ?? session.playlist?.title}
                {" · "}
                {new Date(session.started_at).toLocaleString()}
              </p>
            </div>
            <Link
              href={`/live/${session.id}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${
                live
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {live ? (
                <>
                  <Radio className="h-3 w-3" />
                  Join
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Watch recording
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContentSection({
  title,
  items,
  hrefFor,
}: {
  title: string;
  items: ContentRow[];
  hrefFor: (id: string) => string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <p className="text-sm font-medium">{item.title}</p>
            <Link
              href={hrefFor(item.id)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Radio className="h-3 w-3" />
              Go Live
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

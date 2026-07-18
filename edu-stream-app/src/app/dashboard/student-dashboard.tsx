import Link from "next/link";
import { BookOpen, ListVideo, Play, Radio, Search, Sparkles, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { reconcilePendingRecordings } from "@/lib/live-session";
import { SidebarNavLink } from "./sidebar-nav-link";

export function StudentSidebar({
  profile,
}: {
  profile: { full_name: string | null };
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-neutral-200 bg-neutral-50 px-4 py-6 md:w-64 md:border-b-0 md:border-r">
      <SidebarNavLink href="/dashboard" icon={<BookOpen className="h-4 w-4" />}>
        Student Dashboard
      </SidebarNavLink>
      <SidebarNavLink href="/courses" icon={<Search className="h-4 w-4" />}>
        Search Courses
      </SidebarNavLink>
      <SidebarNavLink href="/playlists" icon={<ListVideo className="h-4 w-4" />}>
        Playlists
      </SidebarNavLink>
      <Link
        href="/dashboard#recorded-classes"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
      >
        <Video className="h-4 w-4" />
        My Learning
      </Link>

      <div className="mt-auto flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {(profile.full_name ?? "S").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {profile.full_name ?? "Student"}
          </p>
          <p className="text-xs text-neutral-500">Student</p>
        </div>
      </div>
    </aside>
  );
}

type ParentRef = { title: string; thumbnail_url: string | null } | null;
type CategoryRef = { title: string; category: { name: string } | null } | null;

type LiveRow = {
  id: string;
  title: string;
  host: { full_name: string | null } | null;
  course: ParentRef;
  playlist: ParentRef;
};

type RecordingRow = {
  id: string;
  title: string;
  ended_at: string | null;
  host: { full_name: string | null } | null;
  course: CategoryRef;
  playlist: CategoryRef;
};

type CourseModuleLessonRow = {
  course: { id: string; title: string; category: { name: string } | null } | null;
  lesson: { id: string; title: string; created_at: string }[];
};

type PlaylistLessonRow = {
  id: string;
  title: string;
  created_at: string;
  playlist: { id: string; title: string; category: { name: string } | null } | null;
};

// A single browsable item shown in either the "Recorded Classes" or
// "Lessons" section: a finished live session recording, or a regular
// uploaded lesson from an enrolled course/playlist. Shared shape so both
// kinds can reuse the same card and filtering logic.
type LibraryItem = {
  id: string;
  title: string;
  category: string;
  parentTitle: string | null;
  hostName: string | null;
  href: string;
  kind: "live" | "lesson";
  sortKey: string;
};

export async function StudentDashboard({
  studentId,
  categoryFilter,
  lessonCategoryFilter,
}: {
  studentId: string;
  categoryFilter?: string;
  lessonCategoryFilter?: string;
}) {
  const supabase = await createClient();

  // RLS already limits both queries to sessions this student is allowed to
  // see (host, institution teammate, or enrolled student).
  const [{ data: liveRows }, { data: enrollmentRows }] = await Promise.all([
    supabase
      .from("live_session")
      .select(
        "id, title, host:profiles!live_session_host_id_fkey(full_name), course(title, thumbnail_url), playlist(title, thumbnail_url)"
      )
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(3),
    supabase
      .from("enrollment")
      .select("course_id, playlist_id")
      .eq("student_id", studentId),
  ]);

  const liveSessions = (liveRows ?? []) as unknown as LiveRow[];

  const courseIds = (enrollmentRows ?? [])
    .map((e) => e.course_id)
    .filter((v): v is string => !!v);
  const playlistIds = (enrollmentRows ?? [])
    .map((e) => e.playlist_id)
    .filter((v): v is string => !!v);

  // A recording only ever flips from "processing" to "ready" via
  // reconciliation, which used to only run on that one session's own
  // /live/[id] page. Self-heal here too, so a student browsing the
  // dashboard doesn't need to have happened to open that exact URL.
  await reconcilePendingRecordings({ courseIds, playlistIds });

  // Regular lesson videos from enrolled content, so "Recorded Classes"
  // isn't limited to live-session recordings only.
  const [{ data: recordingRows }, { data: courseModuleRows }, { data: playlistLessonRows }] =
    await Promise.all([
      supabase
        .from("live_session")
        .select(
          "id, title, ended_at, host:profiles!live_session_host_id_fkey(full_name), course(title, category(name)), playlist(title, category(name))"
        )
        .eq("recording_status", "ready")
        .order("ended_at", { ascending: false }),
      courseIds.length
        ? supabase
            .from("module")
            .select(
              "course:course_id(id, title, category(name)), lesson(id, title, created_at)"
            )
            .in("course_id", courseIds)
        : Promise.resolve({ data: [] as CourseModuleLessonRow[] }),
      playlistIds.length
        ? supabase
            .from("lesson")
            .select("id, title, created_at, playlist:playlist_id(id, title, category(name))")
            .in("playlist_id", playlistIds)
        : Promise.resolve({ data: [] as PlaylistLessonRow[] }),
    ]);

  const recordings = (recordingRows ?? []) as unknown as RecordingRow[];
  const courseModules = (courseModuleRows ?? []) as unknown as CourseModuleLessonRow[];
  const playlistLessons = (playlistLessonRows ?? []) as unknown as PlaylistLessonRow[];

  const recordingItems: LibraryItem[] = recordings.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.course?.category?.name ?? r.playlist?.category?.name ?? "Uncategorized",
    parentTitle: r.course?.title ?? r.playlist?.title ?? null,
    hostName: r.host?.full_name ?? "Host",
    href: `/live/${r.id}`,
    kind: "live",
    sortKey: r.ended_at ?? "",
  }));

  const courseLessonItems: LibraryItem[] = courseModules.flatMap((m) =>
    m.lesson.map((l) => ({
      id: l.id,
      title: l.title,
      category: m.course?.category?.name ?? "Uncategorized",
      parentTitle: m.course?.title ?? null,
      hostName: null,
      href: m.course ? `/courses/${m.course.id}/lessons/${l.id}` : "#",
      kind: "lesson" as const,
      sortKey: l.created_at,
    }))
  );

  const playlistLessonItems: LibraryItem[] = playlistLessons.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.playlist?.category?.name ?? "Uncategorized",
    parentTitle: l.playlist?.title ?? null,
    hostName: null,
    href: l.playlist ? `/playlists/${l.playlist.id}/lessons/${l.id}` : "#",
    kind: "lesson" as const,
    sortKey: l.created_at,
  }));

  const liveStreamItems = recordingItems.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const lessonItems = [...courseLessonItems, ...playlistLessonItems].sort((a, b) =>
    b.sortKey.localeCompare(a.sortKey)
  );

  const liveStreamCategories = Array.from(
    new Set(liveStreamItems.map((item) => item.category))
  );
  const lessonCategories = Array.from(new Set(lessonItems.map((item) => item.category)));

  const activeCategory =
    categoryFilter && liveStreamCategories.includes(categoryFilter) ? categoryFilter : null;
  const activeLessonCategory =
    lessonCategoryFilter && lessonCategories.includes(lessonCategoryFilter)
      ? lessonCategoryFilter
      : null;

  const visibleLiveStreams = activeCategory
    ? liveStreamItems.filter((item) => item.category === activeCategory)
    : liveStreamItems;
  const visibleLessons = activeLessonCategory
    ? lessonItems.filter((item) => item.category === activeLessonCategory)
    : lessonItems;

  const [featuredLive, ...restLive] = liveSessions;

  return (
    <div className="flex-1 px-6 py-8 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-indigo-600">Overview</p>
          <form action="/courses" method="GET" className="w-full sm:max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                name="q"
                placeholder="Search for courses..."
                className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </form>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          <h2 className="text-xl font-semibold">Live Now</h2>
        </div>

        {liveSessions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            Nothing&apos;s live right now. Check back later, or browse
            recorded classes below.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <LiveCard session={featuredLive} featured />
            {restLive.length > 0 && (
              <div className="flex flex-col gap-4">
                {restLive.map((session) => (
                  <LiveCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Preview
          </span>
          <h2 className="mt-4 text-3xl font-bold">
            Personalized Learning Paths
          </h2>
          <p className="mt-2 max-w-lg text-sm text-indigo-100">
            A future eduStream feature: AI-curated tracks based on your
            progress, to help you reach your goals faster. Not built yet —
            this is a preview of what&apos;s coming.
          </p>
        </div>

        <div id="recorded-classes" className="mt-12 scroll-mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recorded Classes</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Live sessions you have access to, recorded and ready to
                watch anytime.
              </p>
            </div>
            {liveStreamCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <CategoryTab label="All" active={!activeCategory} href="/dashboard" />
                {liveStreamCategories.map((name) => (
                  <CategoryTab
                    key={name}
                    label={name}
                    active={activeCategory === name}
                    href={`/dashboard?category=${encodeURIComponent(name)}#recorded-classes`}
                  />
                ))}
              </div>
            )}
          </div>

          {visibleLiveStreams.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No recorded classes {activeCategory ? "in this category " : ""}
              yet. Once a live session you have access to ends and finishes
              processing, it&apos;ll show up here.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleLiveStreams.map((item) => (
                <RecordingCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>

        <div id="lessons" className="mt-12 scroll-mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lessons</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Lesson videos from courses and playlists you&apos;re
                enrolled in.
              </p>
            </div>
            {lessonCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <CategoryTab
                  label="All"
                  active={!activeLessonCategory}
                  href="/dashboard#lessons"
                />
                {lessonCategories.map((name) => (
                  <CategoryTab
                    key={name}
                    label={name}
                    active={activeLessonCategory === name}
                    href={`/dashboard?lessonCategory=${encodeURIComponent(name)}#lessons`}
                  />
                ))}
              </div>
            )}
          </div>

          {visibleLessons.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No lessons {activeLessonCategory ? "in this category " : ""}
              yet. Lesson videos from courses or playlists you&apos;re
              enrolled in will show up here.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleLessons.map((item) => (
                <RecordingCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

function CategoryTab({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {label}
    </Link>
  );
}

function LiveCard({
  session,
  featured,
}: {
  session: LiveRow;
  featured?: boolean;
}) {
  const parentTitle = session.course?.title ?? session.playlist?.title ?? null;
  const thumbnail = session.course?.thumbnail_url ?? session.playlist?.thumbnail_url ?? null;

  return (
    <Link
      href={`/live/${session.id}`}
      className={`group relative block overflow-hidden rounded-xl bg-neutral-900 ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div
        className={`relative w-full bg-gradient-to-br from-neutral-800 to-neutral-950 ${
          featured ? "h-72" : "h-32"
        }`}
      >
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a configured next/image domain
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover opacity-70"
          />
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          <Radio className="h-3 w-3" />
          LIVE
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="truncate text-sm font-semibold text-white">
            {session.title}
          </p>
          <p className="truncate text-xs text-neutral-300">
            {session.host?.full_name ?? "Host"}
            {parentTitle ? ` · ${parentTitle}` : ""}
          </p>
        </div>
        {featured && (
          <div className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-indigo-600 group-hover:bg-white">
            <Play className="h-5 w-5 fill-current" />
          </div>
        )}
      </div>
    </Link>
  );
}

function RecordingCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={item.href}
      className="block overflow-hidden rounded-xl border border-neutral-200 hover:border-neutral-300"
    >
      <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
        <Play className="h-8 w-8 text-white/70" />
      </div>
      <div className="p-4">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {item.category}
        </span>
        <p className="mt-2 truncate text-sm font-semibold">{item.title}</p>
        {item.parentTitle && (
          <p className="truncate text-xs text-neutral-500">{item.parentTitle}</p>
        )}
        {item.hostName && (
          <p className="mt-2 truncate text-xs text-neutral-500">{item.hostName}</p>
        )}
      </div>
    </Link>
  );
}

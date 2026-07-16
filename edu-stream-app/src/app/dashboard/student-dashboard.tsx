import Link from "next/link";
import { BookOpen, Home, Play, Radio, Search, Sparkles, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

export async function StudentDashboard({
  profile,
  categoryFilter,
}: {
  profile: { id: string; full_name: string | null };
  categoryFilter?: string;
}) {
  const supabase = await createClient();

  // RLS already limits both queries to sessions this student is allowed to
  // see (host, institution teammate, or enrolled student).
  const [{ data: liveRows }, { data: recordingRows }] = await Promise.all([
    supabase
      .from("live_session")
      .select(
        "id, title, host:profiles!live_session_host_id_fkey(full_name), course(title, thumbnail_url), playlist(title, thumbnail_url)"
      )
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(3),
    supabase
      .from("live_session")
      .select(
        "id, title, ended_at, host:profiles!live_session_host_id_fkey(full_name), course(title, category(name)), playlist(title, category(name))"
      )
      .eq("recording_status", "ready")
      .order("ended_at", { ascending: false }),
  ]);

  const liveSessions = (liveRows ?? []) as unknown as LiveRow[];
  const recordings = (recordingRows ?? []) as unknown as RecordingRow[];

  const categories = Array.from(
    new Set(
      recordings.map(
        (r) => r.course?.category?.name ?? r.playlist?.category?.name ?? "Uncategorized"
      )
    )
  );

  const activeCategory = categoryFilter && categories.includes(categoryFilter)
    ? categoryFilter
    : null;

  const visibleRecordings = activeCategory
    ? recordings.filter(
        (r) =>
          (r.course?.category?.name ?? r.playlist?.category?.name ?? "Uncategorized") ===
          activeCategory
      )
    : recordings;

  const [featuredLive, ...restLive] = liveSessions;

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-neutral-200 bg-neutral-50 px-4 py-6 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
          <BookOpen className="h-4 w-4" />
          Student Dashboard
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/courses"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <Search className="h-4 w-4" />
          Search Courses
        </Link>
        <Link
          href="#recorded-classes"
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
                Classes you have access to, recorded and ready to watch
                anytime.
              </p>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <CategoryTab label="All" active={!activeCategory} href="/dashboard" />
                {categories.map((name) => (
                  <CategoryTab
                    key={name}
                    label={name}
                    active={activeCategory === name}
                    href={`/dashboard?category=${encodeURIComponent(name)}`}
                  />
                ))}
              </div>
            )}
          </div>

          {visibleRecordings.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No recorded classes {activeCategory ? "in this category " : ""}
              yet. Once a live session you have access to ends and finishes
              processing, it&apos;ll show up here.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleRecordings.map((recording) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </div>
          )}
        </div>
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

function RecordingCard({ recording }: { recording: RecordingRow }) {
  const parentTitle = recording.course?.title ?? recording.playlist?.title ?? null;
  const category =
    recording.course?.category?.name ?? recording.playlist?.category?.name ?? "Uncategorized";

  return (
    <Link
      href={`/live/${recording.id}`}
      className="block overflow-hidden rounded-xl border border-neutral-200 hover:border-neutral-300"
    >
      <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
        <Play className="h-8 w-8 text-white/70" />
      </div>
      <div className="p-4">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {category}
        </span>
        <p className="mt-2 truncate text-sm font-semibold">{recording.title}</p>
        {parentTitle && (
          <p className="truncate text-xs text-neutral-500">{parentTitle}</p>
        )}
        <p className="mt-2 truncate text-xs text-neutral-500">
          {recording.host?.full_name ?? "Host"}
        </p>
      </div>
    </Link>
  );
}

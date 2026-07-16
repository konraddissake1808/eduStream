import Link from "next/link";
import { Building2, Plus, Radio, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/currency";

type CourseRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
};

type EnrollmentRow = {
  student_id: string;
  course_id: string | null;
  amount_paid: number;
};

// Sample-only: a real peer/community feed isn't built yet, this just
// previews the layout for that eventual feature.
const PEER_PLACEHOLDERS = [
  { initials: "SC", name: "Sarah Chen", tag: "Motion Design" },
  { initials: "MT", name: "Marcus Thorne", tag: "Cloud Security" },
  { initials: "ER", name: "Dr. Elena Ross", tag: "Ethics in AI" },
  { initials: "JL", name: "Jordan Lee", tag: "Full-Stack Bootcamp" },
];

export async function TeacherDashboard({
  profile,
}: {
  profile: { id: string; full_name: string | null };
}) {
  const supabase = await createClient();

  const { data: courseRows } = await supabase
    .from("course")
    .select("id, title, thumbnail_url, is_published, created_at")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const courses = (courseRows ?? []) as CourseRow[];
  const courseIds = courses.map((c) => c.id);

  const { data: enrollmentRows } = courseIds.length
    ? await supabase
        .from("enrollment")
        .select("student_id, course_id, amount_paid")
        .in("course_id", courseIds)
    : { data: [] as EnrollmentRow[] };

  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[];

  const studentsByCourse = new Map<string, Set<string>>();
  const earningsByCourse = new Map<string, number>();
  const allStudents = new Set<string>();
  let totalEarnings = 0;

  for (const e of enrollments) {
    if (!e.course_id) continue;
    allStudents.add(e.student_id);
    totalEarnings += Number(e.amount_paid);
    if (!studentsByCourse.has(e.course_id)) {
      studentsByCourse.set(e.course_id, new Set());
    }
    studentsByCourse.get(e.course_id)!.add(e.student_id);
    earningsByCourse.set(
      e.course_id,
      (earningsByCourse.get(e.course_id) ?? 0) + Number(e.amount_paid)
    );
  }

  const previewCourses = courses.slice(0, 3);

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-6 border-b border-neutral-200 bg-neutral-50 px-4 py-6 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {(profile.full_name ?? "T").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {profile.full_name ?? "Teacher"}
            </p>
            <p className="text-xs text-neutral-500">Teacher</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
          <Radio className="h-4 w-4" />
          Teacher Dashboard
        </div>

        <Link
          href="/dashboard/my-institutions"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <Building2 className="h-4 w-4" />
          My Institutions
        </Link>

        <Link
          href="/dashboard/courses/new"
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Publish New Course
        </Link>
      </aside>

      <div className="flex-1 px-6 py-8 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-bold text-transparent">
              Teacher Dashboard
            </h1>
            <p className="mt-1 max-w-lg text-sm text-neutral-600">
              Manage your curriculum, track student engagement, and grow
              your classroom footprint with eduStream.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Reach</p>
              <p className="text-lg font-bold leading-tight">
                {formatCompact(allStudents.size)}{" "}
                <span className="text-sm font-semibold text-neutral-500">
                  Students
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Total Earnings"
            value={formatPrice(totalEarnings)}
            accent="border-indigo-600"
          />
          <StatTile
            label="Average Rating"
            value="—"
            caption="Not tracked yet"
            accent="border-teal-600"
          />
          <StatTile
            label="Course Views"
            value="—"
            caption="Not tracked yet"
            accent="border-neutral-800"
          />
          <StatTile
            label="Completion Rate"
            value="—"
            caption="Not tracked yet"
            accent="border-rose-600"
          />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Courses</h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            View All Courses &rarr;
          </Link>
        </div>

        {previewCourses.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            You haven&apos;t created any courses yet.{" "}
            <Link
              href="/dashboard/courses/new"
              className="font-medium text-indigo-600 underline"
            >
              Create your first course
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previewCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                students={studentsByCourse.get(course.id)?.size ?? 0}
                earnings={earningsByCourse.get(course.id) ?? 0}
              />
            ))}
          </div>
        )}

        <div className="mt-12">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Peer Discovery</h2>
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
              COMMUNITY
            </span>
          </div>
          <div className="mt-4 rounded-xl bg-neutral-100 p-6">
            <p className="text-sm text-neutral-600">
              Explore what other educators are building. This is a preview
              of an upcoming feature — peer profiles aren&apos;t live yet.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PEER_PLACEHOLDERS.map((peer) => (
                <div
                  key={peer.name}
                  className="flex items-center gap-3 rounded-lg bg-white p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {peer.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {peer.name}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {peer.tag}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption?: string;
  accent: string;
}) {
  return (
    <div className={`rounded-lg border-l-4 ${accent} bg-white p-4 shadow-sm`}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {caption && <p className="mt-0.5 text-xs text-neutral-400">{caption}</p>}
    </div>
  );
}

function CourseCard({
  course,
  students,
  earnings,
}: {
  course: CourseRow;
  students: number;
  earnings: number;
}) {
  if (!course.is_published) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <div className="relative h-40 w-full bg-gradient-to-br from-neutral-800 to-neutral-900">
          {course.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a configured next/image domain
            <img
              src={course.thumbnail_url}
              alt=""
              className="h-full w-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 px-4 text-center">
            <p className="text-sm font-semibold text-white">Draft Mode</p>
            <p className="text-xs text-neutral-200">
              Finish setting up this course to publish it.
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="truncate text-sm font-semibold">{course.title}</p>
          <Link
            href={`/dashboard/courses/${course.id}/edit`}
            className="mt-3 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            Continue Editing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="relative h-40 w-full bg-gradient-to-br from-indigo-500 to-violet-600">
        {course.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a configured next/image domain
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
          Published
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold">{course.title}</p>
        <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
          <div>
            <p className="text-neutral-500">Students</p>
            <p className="font-semibold">{students}</p>
          </div>
          <div>
            <p className="text-neutral-500">Earnings</p>
            <p className="font-semibold">{formatPrice(earnings)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Rating</p>
            <p className="font-semibold text-neutral-400">—</p>
          </div>
          <div>
            <p className="text-neutral-500">Views</p>
            <p className="font-semibold text-neutral-400">—</p>
          </div>
        </div>
        <Link
          href={`/dashboard/courses/${course.id}/content`}
          className="mt-4 block rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-medium hover:border-neutral-400"
        >
          Manage Curriculum
        </Link>
      </div>
    </div>
  );
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

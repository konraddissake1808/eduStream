import Link from "next/link";
import { Building2, Plus, Radio, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/currency";
import { logout } from "@/app/auth/actions";
import { AddMemberForm } from "./institution/add-member-form";
import { removeMember } from "./institution/actions";

type CourseRow = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  is_published: boolean;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

type EnrollmentRow = {
  student_id: string;
  course_id: string | null;
  amount_paid: number;
  enrolled_at: string;
};

type MemberRow = {
  id: string;
  created_at: string;
  teacher: { id: string; full_name: string | null } | null;
};

export async function InstitutionDashboard({
  institution,
}: {
  institution: { id: string; full_name: string | null };
}) {
  const supabase = await createClient();
  const orFilter = `teacher_id.eq.${institution.id},institution_id.eq.${institution.id}`;

  const [
    { data: courseRows },
    { count: playlistCount },
    { count: activeStreamCount },
    { data: memberRows },
  ] = await Promise.all([
    supabase
      .from("course")
      .select(
        "id, title, thumbnail_url, is_published, category(name), teacher:profiles!course_teacher_id_fkey(full_name)"
      )
      .or(orFilter)
      .order("created_at", { ascending: false }),
    supabase
      .from("playlist")
      .select("id", { count: "exact", head: true })
      .or(orFilter),
    supabase
      .from("live_session")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institution.id)
      .eq("status", "live"),
    supabase
      .from("institution_member")
      .select("id, created_at, teacher:teacher_id(id, full_name)")
      .eq("institution_id", institution.id)
      .order("created_at", { ascending: false }),
  ]);

  const courses = (courseRows ?? []) as unknown as CourseRow[];
  const courseIds = courses.map((c) => c.id);
  const members = (memberRows ?? []) as unknown as MemberRow[];

  const { data: enrollmentRows } = courseIds.length
    ? await supabase
        .from("enrollment")
        .select("student_id, course_id, amount_paid, enrolled_at")
        .in("course_id", courseIds)
    : { data: [] as EnrollmentRow[] };

  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const studentsByCourse = new Map<string, Set<string>>();
  const revenueMtdByCourse = new Map<string, number>();
  const allStudents = new Set<string>();
  let revenueMtd = 0;

  for (const e of enrollments) {
    if (!e.course_id) continue;
    allStudents.add(e.student_id);
    if (!studentsByCourse.has(e.course_id)) {
      studentsByCourse.set(e.course_id, new Set());
    }
    studentsByCourse.get(e.course_id)!.add(e.student_id);

    if (new Date(e.enrolled_at) >= startOfMonth) {
      revenueMtd += Number(e.amount_paid);
      revenueMtdByCourse.set(
        e.course_id,
        (revenueMtdByCourse.get(e.course_id) ?? 0) + Number(e.amount_paid)
      );
    }
  }

  const sortedByStudents = [...courses].sort(
    (a, b) => (studentsByCourse.get(b.id)?.size ?? 0) - (studentsByCourse.get(a.id)?.size ?? 0)
  );
  const topCourse = sortedByStudents[0];
  const hasRanking = topCourse && (studentsByCourse.get(topCourse.id)?.size ?? 0) > 0;
  const previewCourses = sortedByStudents.slice(0, 3);

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-neutral-200 bg-neutral-50 px-4 py-6 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
          <Building2 className="h-4 w-4" />
          Institution Dashboard
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {(institution.full_name ?? "I").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {institution.full_name ?? "Institution"}
            </p>
            <p className="text-xs text-neutral-500">Institution Admin</p>
          </div>
        </div>

        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign Out
          </button>
        </form>
      </aside>

      <div className="flex-1 px-6 py-8 sm:px-10">
        <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-bold text-transparent">
          Institution Hub
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Real-time performance metrics for your institution.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Radio className="h-4 w-4" />}
            label="Active Streams"
            value={String(activeStreamCount ?? 0)}
          />
          <StatCard
            icon={<Building2 className="h-4 w-4" />}
            label="Total Content"
            value={String(courses.length + (playlistCount ?? 0))}
            caption={`${courses.length} courses · ${playlistCount ?? 0} playlists`}
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Active Students"
            value={String(allStudents.size)}
            caption="distinct learners enrolled"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Revenue (MTD)"
            value={formatPrice(revenueMtd)}
            caption="across all institution courses"
          />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Institution Courses</h2>
          <Link
            href="/dashboard/courses/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add New Course
          </Link>
        </div>

        {previewCourses.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No courses yet.{" "}
            <Link
              href="/dashboard/courses/new"
              className="font-medium text-indigo-600 underline"
            >
              Create your first course
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <CourseCard
              course={previewCourses[0]}
              students={studentsByCourse.get(previewCourses[0].id)?.size ?? 0}
              revenueMtd={revenueMtdByCourse.get(previewCourses[0].id) ?? 0}
              featured
              topCourse={hasRanking}
            />
            {previewCourses.length > 1 && (
              <div className="flex flex-col gap-6">
                {previewCourses.slice(1).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    students={studentsByCourse.get(course.id)?.size ?? 0}
                    revenueMtd={revenueMtdByCourse.get(course.id) ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {courses.length > 3 && (
          <div className="mt-4 text-right">
            <Link
              href="/dashboard/courses"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              View all {courses.length} courses &rarr;
            </Link>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-xl font-semibold">Authorized Personnel</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Teachers who can create and manage content posted as{" "}
            {institution.full_name ?? "your institution"}.
          </p>

          <div className="mt-4 rounded-xl border border-neutral-200 p-4">
            <AddMemberForm />
          </div>

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No teachers have joined yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Member Since</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-medium">
                        {member.teacher?.full_name ?? "Unknown teacher"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={removeMember.bind(null, member.id)}>
                          <button
                            type="submit"
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          {icon}
        </span>
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {caption && <p className="mt-0.5 text-xs text-neutral-400">{caption}</p>}
    </div>
  );
}

function CourseCard({
  course,
  students,
  revenueMtd,
  featured,
  topCourse,
}: {
  course: CourseRow;
  students: number;
  revenueMtd: number;
  featured?: boolean;
  topCourse?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <div
        className={`relative w-full bg-gradient-to-br from-indigo-500 to-violet-600 ${
          featured ? "h-48" : "h-28"
        }`}
      >
        {course.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a configured next/image domain
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {featured && topCourse && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
              Top course
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              course.is_published
                ? "bg-indigo-600 text-white"
                : "bg-neutral-800 text-white"
            }`}
          >
            {course.is_published ? "Published" : "Draft"}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold">{course.title}</p>
        <p className="truncate text-xs text-neutral-500">
          {course.category?.name ?? "Uncategorized"}
          {course.teacher?.full_name ? ` · ${course.teacher.full_name}` : ""}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
          <div>
            <p className="text-neutral-500">Students</p>
            <p className="font-semibold">{students}</p>
          </div>
          <div>
            <p className="text-neutral-500">Revenue (MTD)</p>
            <p className="font-semibold">{formatPrice(revenueMtd)}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/dashboard/courses/${course.id}/content`}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-medium hover:border-neutral-400"
          >
            Edit Content
          </Link>
          <Link
            href={`/dashboard/courses/${course.id}/live`}
            className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            Live Insights
          </Link>
        </div>
      </div>
    </div>
  );
}

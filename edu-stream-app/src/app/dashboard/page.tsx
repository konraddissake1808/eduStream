import Link from "next/link";
import { requireProfile, getMyInstitutionMemberships } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireProfile("/dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">
        Welcome back, {profile.full_name ?? "there"}
      </h1>
      <p className="mt-1 text-sm capitalize text-neutral-500">
        {profile.role} dashboard
      </p>

      {profile.role === "student" ? (
        <StudentOverview studentId={profile.id} />
      ) : (
        <TeacherOverview
          teacherId={profile.id}
          role={profile.role}
        />
      )}
    </div>
  );
}

type EnrollmentRow = {
  id: string;
  course: { id: string; title: string } | null;
  playlist: { id: string; title: string } | null;
};

async function StudentOverview({ studentId }: { studentId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("enrollment")
    .select("id, course(id, title), playlist(id, title)")
    .eq("student_id", studentId)
    .order("enrolled_at", { ascending: false });

  const enrollments = (data ?? []) as unknown as EnrollmentRow[];

  if (!enrollments.length) {
    return (
      <div className="mt-8 rounded-lg border border-neutral-200 p-6 text-sm text-neutral-600">
        <p>
          You haven&apos;t enrolled in anything yet.{" "}
          <Link href="/courses" className="font-medium underline">
            Browse courses
          </Link>{" "}
          or{" "}
          <Link href="/playlists" className="font-medium underline">
            browse playlists
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {enrollments.map((enrollment) => {
        const item = enrollment.course
          ? { href: `/courses/${enrollment.course.id}`, title: enrollment.course.title, kind: "Course" }
          : { href: `/playlists/${enrollment.playlist!.id}`, title: enrollment.playlist!.title, kind: "Playlist" };

        return (
          <li key={enrollment.id} className="px-4 py-3">
            <Link href={item.href} className="text-sm font-medium underline">
              {item.title}
            </Link>
            <p className="mt-1 text-xs text-neutral-500">{item.kind}</p>
          </li>
        );
      })}
    </ul>
  );
}

async function TeacherOverview({
  teacherId,
  role,
}: {
  teacherId: string;
  role: "teacher" | "institution";
}) {
  const supabase = await createClient();

  const institutionIds =
    role === "institution"
      ? [teacherId]
      : (await getMyInstitutionMemberships()).map((m) => m.institution.id);

  const orFilter = institutionIds.length
    ? `teacher_id.eq.${teacherId},institution_id.in.(${institutionIds.join(",")})`
    : `teacher_id.eq.${teacherId}`;

  const [{ count: courseCount }, { count: playlistCount }] =
    await Promise.all([
      supabase
        .from("course")
        .select("id", { count: "exact", head: true })
        .or(orFilter),
      supabase
        .from("playlist")
        .select("id", { count: "exact", head: true })
        .or(orFilter),
    ]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link
        href="/dashboard/courses"
        className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
      >
        <p className="text-sm text-neutral-500">Courses</p>
        <p className="mt-1 text-2xl font-semibold">{courseCount ?? 0}</p>
        <p className="mt-2 text-sm font-medium">Manage courses &rarr;</p>
      </Link>

      <Link
        href="/dashboard/playlists"
        className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
      >
        <p className="text-sm text-neutral-500">Playlists</p>
        <p className="mt-1 text-2xl font-semibold">{playlistCount ?? 0}</p>
        <p className="mt-2 text-sm font-medium">Manage playlists &rarr;</p>
      </Link>

      {role === "institution" ? (
        <Link
          href="/dashboard/institution"
          className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
        >
          <p className="text-sm text-neutral-500">Teacher members</p>
          <p className="mt-2 text-sm font-medium">Manage members &rarr;</p>
        </Link>
      ) : (
        <Link
          href="/dashboard/my-institutions"
          className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
        >
          <p className="text-sm text-neutral-500">Institutions</p>
          <p className="mt-2 text-sm font-medium">
            Join or leave institutions &rarr;
          </p>
        </Link>
      )}
    </div>
  );
}

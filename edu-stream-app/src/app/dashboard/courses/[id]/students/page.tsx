import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";

type EnrollmentRow = {
  id: string;
  enrolled_at: string;
  student: { full_name: string | null } | null;
};

export default async function CourseStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/courses/${id}/students`);

  const supabase = await createClient();

  // No app-level ownership filter: RLS already limits this to the
  // course's own teacher or a fellow institution-member teacher.
  const { data: course } = await supabase
    .from("course")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!course) {
    notFound();
  }

  const { data } = await supabase
    .from("enrollment")
    .select(
      "id, enrolled_at, student:profiles!enrollment_student_id_fkey(full_name)"
    )
    .eq("course_id", id)
    .order("enrolled_at", { ascending: false });

  const enrollments = (data ?? []) as unknown as EnrollmentRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {enrollments.length} enrolled student
        {enrollments.length === 1 ? "" : "s"}
      </p>

      {enrollments.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No students have enrolled yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium">
                {enrollment.student?.full_name ?? "Student"}
              </span>
              <span className="text-xs text-neutral-500">
                Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

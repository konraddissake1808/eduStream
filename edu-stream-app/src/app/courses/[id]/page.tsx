import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { EnrollButton } from "./enroll-button";

type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  teacher_id: string;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("course")
    .select(
      "id, title, description, price, teacher_id, category(name), teacher:profiles(full_name)"
    )
    .eq("id", id)
    .single();

  const course = data as unknown as CourseDetail | null;

  if (!course) {
    notFound();
  }

  const profile = await getProfile();
  const isOwner = profile?.id === course.teacher_id;

  let isEnrolled = false;
  if (profile && !isOwner) {
    const { data: enrollment } = await supabase
      .from("enrollment")
      .select("id")
      .eq("course_id", course.id)
      .eq("student_id", profile.id)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {course.category?.name ?? "Uncategorized"}
        {course.teacher?.full_name ? ` · by ${course.teacher.full_name}` : ""}
        {" · "}
        {course.price > 0 ? `$${course.price}` : "Free"}
      </p>

      {course.description && (
        <p className="mt-6 whitespace-pre-line text-sm text-neutral-700">
          {course.description}
        </p>
      )}

      <div className="mt-8">
        {isOwner ? (
          <p className="text-sm text-neutral-500">This is your course.</p>
        ) : isEnrolled ? (
          <p className="text-sm font-medium text-green-700">
            You&apos;re enrolled in this course.
          </p>
        ) : !profile ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/courses/${course.id}`)}`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Log in to enroll
          </Link>
        ) : course.price > 0 ? (
          <p className="text-sm text-neutral-500">
            Paid enrollment isn&apos;t available yet.
          </p>
        ) : (
          <EnrollButton courseId={course.id} />
        )}
      </div>
    </div>
  );
}

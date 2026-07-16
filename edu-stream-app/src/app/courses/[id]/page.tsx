import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/dal";
import { formatPrice } from "@/lib/currency";
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

type LessonRow = { id: string; title: string; is_preview: boolean };
type ModuleRow = { id: string; title: string; lesson: LessonRow[] };

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
      "id, title, description, price, teacher_id, category(name), teacher:profiles!course_teacher_id_fkey(full_name)"
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

  // RLS already limits this to sessions the viewer is allowed to join
  // (host, institution teammate, or enrolled student), so no need to
  // gate the query itself on isOwner/isEnrolled.
  let liveSession: { id: string; title: string } | null = null;
  if (profile) {
    const { data: live } = await supabase
      .from("live_session")
      .select("id, title")
      .eq("course_id", course.id)
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    liveSession = live;
  }

  // RLS only returns lessons this viewer can actually see (previews,
  // enrolled students, or the owner/institution), so this list is safe
  // to render as-is with no extra filtering.
  const { data: moduleData } = await supabase
    .from("module")
    .select("id, title, lesson(id, title, is_preview)")
    .eq("course_id", course.id)
    .order("position")
    .order("position", { referencedTable: "lesson" });

  const modules = (moduleData ?? []) as unknown as ModuleRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {course.category?.name ?? "Uncategorized"}
        {course.teacher?.full_name ? ` · by ${course.teacher.full_name}` : ""}
        {" · "}
        {course.price > 0 ? formatPrice(course.price) : "Free"}
      </p>

      {course.description && (
        <p className="mt-6 whitespace-pre-line text-sm text-neutral-700">
          {course.description}
        </p>
      )}

      {liveSession && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            Live now &middot; {liveSession.title}
          </p>
          <Link
            href={`/live/${liveSession.id}`}
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
          >
            Join
          </Link>
        </div>
      )}

      {modules.length > 0 && (
        <div className="mt-8 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Curriculum</h2>
          {modules.map((module) => (
            <div key={module.id}>
              <p className="text-sm font-medium">{module.title}</p>
              {module.lesson.length > 0 && (
                <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                  {module.lesson.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
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
              )}
            </div>
          ))}
        </div>
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

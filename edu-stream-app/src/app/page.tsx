import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/dal";
import { formatPrice } from "@/lib/currency";

type CourseRow = {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string | null;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

const PREVIEW_COUNT = 8;

export default async function Home() {
  const [user, { data: courseRows }] = await Promise.all([
    getAuthUser(),
    (await createClient())
      .from("course")
      .select(
        "id, title, price, thumbnail_url, category(name), teacher:profiles!course_teacher_id_fkey(full_name)"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(PREVIEW_COUNT),
  ]);

  const courses = (courseRows ?? []) as unknown as CourseRow[];

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-neutral-200 bg-neutral-50 px-6 py-16 text-center sm:px-10">
        <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Learn from live experts,
          <br className="hidden sm:block" /> on your own time.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-600 sm:text-base">
          Browse eduStream&apos;s courses below. Sign up free to enroll,
          join live sessions, and track your learning.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-white"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Explore courses</h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            View all courses &rarr;
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-500">
            No courses are available yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseCard({ course }: { course: CourseRow }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block overflow-hidden rounded-xl border border-neutral-200 hover:border-neutral-300"
    >
      <div className="relative h-32 w-full bg-gradient-to-br from-indigo-500 to-violet-600">
        {course.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a configured next/image domain
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold">{course.title}</p>
        <p className="mt-1 truncate text-xs text-neutral-500">
          {course.category?.name ?? "Uncategorized"}
          {course.teacher?.full_name ? ` · ${course.teacher.full_name}` : ""}
        </p>
        <p className="mt-2 text-sm font-medium text-indigo-600">
          {course.price > 0 ? formatPrice(course.price) : "Free"}
        </p>
      </div>
    </Link>
  );
}

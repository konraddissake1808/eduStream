import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/currency";

type CourseRow = {
  id: string;
  title: string;
  price: number;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

export default async function CoursesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("course")
    .select(
      "id, title, price, category(name), teacher:profiles!course_teacher_id_fkey(full_name)"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    query = query.ilike("title", `%${q.trim()}%`);
  }

  const { data } = await query;

  const courses = (data ?? []) as unknown as CourseRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Courses</h1>

      <form action="/courses" method="GET" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search courses..."
          className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </form>

      {!courses.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          {q?.trim()
            ? `No courses match "${q.trim()}".`
            : "No courses are available yet."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {courses.map((course) => (
            <li key={course.id} className="px-4 py-3">
              <Link
                href={`/courses/${course.id}`}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                {course.title}
              </Link>
              <p className="mt-1 text-xs text-neutral-500">
                {course.category?.name ?? "Uncategorized"}
                {course.teacher?.full_name
                  ? ` · by ${course.teacher.full_name}`
                  : ""}{" "}
                · {course.price > 0 ? formatPrice(course.price) : "Free"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

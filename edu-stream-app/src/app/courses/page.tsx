import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  price: number;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

export default async function CoursesCatalogPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("course")
    .select("id, title, price, category(name), teacher:profiles(full_name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const courses = (data ?? []) as unknown as CourseRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Courses</h1>

      {!courses.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          No courses are available yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {courses.map((course) => (
            <li key={course.id} className="px-4 py-3">
              <Link
                href={`/courses/${course.id}`}
                className="text-sm font-medium underline"
              >
                {course.title}
              </Link>
              <p className="mt-1 text-xs text-neutral-500">
                {course.category?.name ?? "Uncategorized"}
                {course.teacher?.full_name
                  ? ` · by ${course.teacher.full_name}`
                  : ""}{" "}
                · {course.price > 0 ? `$${course.price}` : "Free"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

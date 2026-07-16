import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  requireContentCreator,
  getMyInstitutionMemberships,
} from "@/lib/supabase/dal";
import { formatPrice } from "@/lib/currency";

type CourseRow = {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  category: { name: string } | null;
};

export default async function CoursesPage() {
  const creator = await requireContentCreator("/dashboard/courses");
  const supabase = await createClient();

  // Show content this account authored directly, plus anything attributed
  // to an institution it's part of (as the institution itself, or as one
  // of that institution's member teachers).
  const institutionIds =
    creator.role === "institution"
      ? [creator.id]
      : (await getMyInstitutionMemberships()).map((m) => m.institution.id);

  const orFilter = institutionIds.length
    ? `teacher_id.eq.${creator.id},institution_id.in.(${institutionIds.join(",")})`
    : `teacher_id.eq.${creator.id}`;

  const { data } = await supabase
    .from("course")
    .select("id, title, price, is_published, category(name)")
    .or(orFilter)
    .order("created_at", { ascending: false });

  const courses = (data ?? []) as unknown as CourseRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your courses</h1>
        <Link
          href="/dashboard/courses/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          New course
        </Link>
      </div>

      {!courses?.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          You haven&apos;t created any courses yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{course.title}</p>
                <p className="text-xs text-neutral-500">
                  {course.category?.name ?? "Uncategorized"} ·{" "}
                  {course.price > 0 ? formatPrice(course.price) : "Free"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    course.is_published
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {course.is_published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/dashboard/courses/${course.id}/content`}
                  className="text-sm font-medium underline"
                >
                  Content
                </Link>
                <Link
                  href={`/dashboard/courses/${course.id}/live`}
                  className="text-sm font-medium underline"
                >
                  Live
                </Link>
                <Link
                  href={`/dashboard/courses/${course.id}/edit`}
                  className="text-sm font-medium underline"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

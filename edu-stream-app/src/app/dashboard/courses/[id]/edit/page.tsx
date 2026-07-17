import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator, getCategories } from "@/lib/supabase/dal";
import { EditCourseForm } from "./edit-course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/courses/${id}/edit`);

  const supabase = await createClient();
  // No app-level ownership filter: RLS already limits this to the course's
  // own teacher or a fellow institution-member teacher.
  const { data: course } = await supabase
    .from("course")
    .select(
      "id, title, description, category_id, price, thumbnail_url, is_published"
    )
    .eq("id", id)
    .single();

  if (!course) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit course</h1>
          <p className="mt-1 text-sm text-neutral-500">{course.title}</p>
        </div>
        <Link
          href={`/courses/${course.id}`}
          className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Link>
      </div>
      <EditCourseForm course={course} categories={categories} />
    </div>
  );
}

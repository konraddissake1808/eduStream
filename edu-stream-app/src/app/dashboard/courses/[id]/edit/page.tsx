import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher, getCategories } from "@/lib/supabase/dal";
import { EditCourseForm } from "./edit-course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = await requireTeacher(`/dashboard/courses/${id}/edit`);

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("course")
    .select(
      "id, title, description, category_id, price, thumbnail_url, is_published"
    )
    .eq("id", id)
    .eq("teacher_id", teacher.id)
    .single();

  if (!course) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Edit course</h1>
      <p className="mt-1 text-sm text-neutral-500">{course.title}</p>
      <EditCourseForm course={course} categories={categories} />
    </div>
  );
}

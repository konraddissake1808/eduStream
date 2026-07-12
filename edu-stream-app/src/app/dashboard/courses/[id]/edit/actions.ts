"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/supabase/dal";

export type EditCourseState = { error: string } | undefined;

export async function updateCourse(
  courseId: string,
  _prevState: EditCourseState,
  formData: FormData
): Promise<EditCourseState> {
  const teacher = await requireTeacher(`/dashboard/courses/${courseId}/edit`);

  const title = formData.get("title");
  const description = formData.get("description");
  const categoryId = formData.get("categoryId");
  const priceRaw = formData.get("price");
  const thumbnailUrl = formData.get("thumbnailUrl");
  const publish = formData.get("publish") === "on";

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required." };
  }

  const price =
    typeof priceRaw === "string" && priceRaw.trim() ? Number(priceRaw) : 0;

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a non-negative number." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course")
    .update({
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      category_id:
        typeof categoryId === "string" && categoryId ? categoryId : null,
      thumbnail_url:
        typeof thumbnailUrl === "string" && thumbnailUrl.trim()
          ? thumbnailUrl.trim()
          : null,
      price,
      is_published: publish,
    })
    // Scoping to teacher_id (in addition to RLS) ensures a not-found/foreign
    // id fails loudly here instead of silently updating zero rows.
    .eq("id", courseId)
    .eq("teacher_id", teacher.id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Course not found." };
  }

  redirect("/dashboard/courses");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { slugify, withRandomSuffix } from "@/lib/slugify";

export type CourseFormState = { error: string } | undefined;

export async function createCourse(
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const creator = await requireContentCreator("/dashboard/courses/new");

  const title = formData.get("title");
  const description = formData.get("description");
  const categoryId = formData.get("categoryId");
  const priceRaw = formData.get("price");
  const thumbnailUrl = formData.get("thumbnailUrl");
  const publish = formData.get("publish") === "on";
  const institutionIdRaw = formData.get("institutionId");

  // Institution accounts always post as themselves. Teachers may attribute
  // the course to an institution they belong to (RLS re-validates this).
  const institutionId =
    creator.role === "institution"
      ? creator.id
      : typeof institutionIdRaw === "string" && institutionIdRaw
        ? institutionIdRaw
        : null;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required." };
  }

  const price =
    typeof priceRaw === "string" && priceRaw.trim() ? Number(priceRaw) : 0;

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a non-negative number." };
  }

  const supabase = await createClient();
  const baseSlug = slugify(title) || "course";

  const insertCourse = (slug: string) =>
    supabase
      .from("course")
      .insert({
        teacher_id: creator.id,
        institution_id: institutionId,
        category_id:
          typeof categoryId === "string" && categoryId ? categoryId : null,
        title: title.trim(),
        slug,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        thumbnail_url:
          typeof thumbnailUrl === "string" && thumbnailUrl.trim()
            ? thumbnailUrl.trim()
            : null,
        price,
        is_published: publish,
      })
      .select("id")
      .single();

  let { data, error } = await insertCourse(baseSlug);

  // Slug collision: retry once with a random suffix.
  if (error?.code === "23505") {
    ({ data, error } = await insertCourse(withRandomSuffix(baseSlug)));
  }

  if (error || !data) {
    return { error: error?.message ?? "Failed to create course." };
  }

  redirect("/dashboard/courses");
}

import { getCategories, getMyInstitutionMemberships } from "@/lib/supabase/dal";
import { CourseForm } from "./course-form";

export default async function NewCoursePage() {
  const [categories, memberships] = await Promise.all([
    getCategories(),
    getMyInstitutionMemberships(),
  ]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">New course</h1>
      <p className="mt-1 text-sm text-neutral-500">
        You can add modules and lessons after creating the course.
      </p>
      <CourseForm
        categories={categories}
        institutions={memberships.map((m) => m.institution)}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { AddModuleForm } from "./add-module-form";
import { AddLessonForm } from "./add-lesson-form";

type LessonRow = {
  id: string;
  title: string;
  is_preview: boolean;
};

type ModuleRow = {
  id: string;
  title: string;
  lesson: LessonRow[];
};

export default async function CourseContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/courses/${id}/content`);

  const supabase = await createClient();

  // No app-level ownership filter: RLS already limits this to the
  // course's own teacher or a fellow institution-member teacher.
  const { data: course } = await supabase
    .from("course")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!course) {
    notFound();
  }

  const { data } = await supabase
    .from("module")
    .select("id, title, lesson(id, title, is_preview)")
    .eq("course_id", id)
    .order("position")
    .order("position", { referencedTable: "lesson" });

  const modules = (data ?? []) as unknown as ModuleRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">Modules &amp; lessons</p>

      <div className="mt-8 flex flex-col gap-6">
        {modules.map((module) => (
          <div
            key={module.id}
            className="rounded-lg border border-neutral-200 p-4"
          >
            <h2 className="text-sm font-semibold">{module.title}</h2>

            {module.lesson.length > 0 && (
              <ul className="mt-3 divide-y divide-neutral-200">
                {module.lesson.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm">{lesson.title}</span>
                    {lesson.is_preview && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                        Preview
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <AddLessonForm courseId={course.id} moduleId={module.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Add module</h2>
        <AddModuleForm courseId={course.id} />
      </div>
    </div>
  );
}

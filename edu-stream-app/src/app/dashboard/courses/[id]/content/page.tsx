import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator } from "@/lib/supabase/dal";
import { reconcilePendingRecordings } from "@/lib/live-session";
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

type PastLiveStreamRow = {
  id: string;
  title: string;
  ended_at: string | null;
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

  await reconcilePendingRecordings({ courseIds: [id] });

  const { data: pastLiveStreamRows } = await supabase
    .from("live_session")
    .select("id, title, ended_at")
    .eq("course_id", id)
    .eq("status", "ended")
    .eq("recording_status", "ready")
    .order("ended_at", { ascending: false });

  const pastLiveStreams = (pastLiveStreamRows ?? []) as PastLiveStreamRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">Modules &amp; lessons</p>

      <div className="mt-8 flex flex-col gap-8">
        {modules.map((module) => (
          <div key={module.id} className="flex flex-col gap-4">
            <div className="rounded-lg border border-neutral-200 p-4">
              <h2 className="text-sm font-semibold">{module.title}</h2>

              {module.lesson.length > 0 ? (
                <ul className="mt-3 divide-y divide-neutral-200">
                  {module.lesson.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm">{lesson.title}</span>
                      <div className="flex items-center gap-2">
                        {lesson.is_preview && (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                            Preview
                          </span>
                        )}
                        <Link
                          href={`/courses/${course.id}/lessons/${lesson.id}`}
                          className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          <Play className="h-3 w-3" />
                          Watch
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  No video published yet.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-neutral-300 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Add lesson to {module.title}
              </h3>
              <div className="mt-3">
                <AddLessonForm courseId={course.id} moduleId={module.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Past live streams</h2>
        {pastLiveStreams.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No recorded live streams yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {pastLiveStreams.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm">{session.title}</p>
                  {session.ended_at && (
                    <p className="text-xs text-neutral-500">
                      {new Date(session.ended_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link
                  href={`/live/${session.id}`}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <Play className="h-3 w-3" />
                  Watch
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Add module</h2>
        <AddModuleForm courseId={course.id} />
      </div>
    </div>
  );
}

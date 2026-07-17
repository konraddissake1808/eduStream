import Link from "next/link";
import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  requireContentCreator,
  getMyInstitutionMemberships,
} from "@/lib/supabase/dal";

type ContentRow = { id: string; title: string };

export default async function LiveSessionsHubPage() {
  const creator = await requireContentCreator("/dashboard/live");
  const supabase = await createClient();

  // Same ownership rule as the courses/playlists lists: content this
  // account authored directly, plus anything attributed to an
  // institution it's part of.
  const institutionIds =
    creator.role === "institution"
      ? [creator.id]
      : (await getMyInstitutionMemberships()).map((m) => m.institution.id);

  const orFilter = institutionIds.length
    ? `teacher_id.eq.${creator.id},institution_id.in.(${institutionIds.join(",")})`
    : `teacher_id.eq.${creator.id}`;

  const [{ data: courseRows }, { data: playlistRows }] = await Promise.all([
    supabase
      .from("course")
      .select("id, title")
      .or(orFilter)
      .order("created_at", { ascending: false }),
    supabase
      .from("playlist")
      .select("id, title")
      .or(orFilter)
      .order("created_at", { ascending: false }),
  ]);

  const courses = (courseRows ?? []) as ContentRow[];
  const playlists = (playlistRows ?? []) as ContentRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Live Sessions</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick a course or playlist to start (or manage) a live session for it.
      </p>

      {courses.length === 0 && playlists.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          You haven&apos;t created any courses or playlists yet.{" "}
          <Link
            href="/dashboard/courses/new"
            className="font-medium text-indigo-600 underline"
          >
            Create your first course
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {courses.length > 0 && (
            <ContentSection
              title="Courses"
              items={courses}
              hrefFor={(id) => `/dashboard/courses/${id}/live`}
            />
          )}
          {playlists.length > 0 && (
            <ContentSection
              title="Playlists"
              items={playlists}
              hrefFor={(id) => `/dashboard/playlists/${id}/live`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ContentSection({
  title,
  items,
  hrefFor,
}: {
  title: string;
  items: ContentRow[];
  hrefFor: (id: string) => string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <p className="text-sm font-medium">{item.title}</p>
            <Link
              href={hrefFor(item.id)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Radio className="h-3 w-3" />
              Go Live
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

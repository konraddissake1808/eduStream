import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireProfile("/dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">
        Welcome back, {profile.full_name ?? "there"}
      </h1>
      <p className="mt-1 text-sm capitalize text-neutral-500">
        {profile.role} dashboard
      </p>

      {profile.role === "teacher" ? (
        <TeacherOverview teacherId={profile.id} />
      ) : (
        <div className="mt-8 rounded-lg border border-neutral-200 p-6 text-sm text-neutral-600">
          <p>Your enrolled courses and playlists will show up here.</p>
        </div>
      )}
    </div>
  );
}

async function TeacherOverview({ teacherId }: { teacherId: string }) {
  const supabase = await createClient();

  const [{ count: courseCount }, { count: playlistCount }] =
    await Promise.all([
      supabase
        .from("course")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId),
      supabase
        .from("playlist")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId),
    ]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link
        href="/dashboard/courses"
        className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
      >
        <p className="text-sm text-neutral-500">Courses</p>
        <p className="mt-1 text-2xl font-semibold">{courseCount ?? 0}</p>
        <p className="mt-2 text-sm font-medium">Manage courses &rarr;</p>
      </Link>

      <Link
        href="/dashboard/playlists"
        className="rounded-lg border border-neutral-200 p-6 hover:border-neutral-400"
      >
        <p className="text-sm text-neutral-500">Playlists</p>
        <p className="mt-1 text-2xl font-semibold">{playlistCount ?? 0}</p>
        <p className="mt-2 text-sm font-medium">Manage playlists &rarr;</p>
      </Link>
    </div>
  );
}

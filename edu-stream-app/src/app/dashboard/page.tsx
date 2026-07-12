import { requireProfile } from "@/lib/supabase/dal";

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

      <div className="mt-8 rounded-lg border border-neutral-200 p-6 text-sm text-neutral-600">
        {profile.role === "teacher" ? (
          <p>Your courses and playlists will show up here.</p>
        ) : (
          <p>Your enrolled courses and playlists will show up here.</p>
        )}
      </div>
    </div>
  );
}

import { getCategories, getMyInstitutionMemberships } from "@/lib/supabase/dal";
import { PlaylistForm } from "./playlist-form";

export default async function NewPlaylistPage() {
  const [categories, memberships] = await Promise.all([
    getCategories(),
    getMyInstitutionMemberships(),
  ]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">New playlist</h1>
      <p className="mt-1 text-sm text-neutral-500">
        You can add lessons after creating the playlist.
      </p>
      <PlaylistForm
        categories={categories}
        institutions={memberships.map((m) => m.institution)}
      />
    </div>
  );
}

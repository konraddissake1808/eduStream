import { getCategories } from "@/lib/supabase/dal";
import { PlaylistForm } from "./playlist-form";

export default async function NewPlaylistPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">New playlist</h1>
      <p className="mt-1 text-sm text-neutral-500">
        You can add lessons after creating the playlist.
      </p>
      <PlaylistForm categories={categories} />
    </div>
  );
}

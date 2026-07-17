import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireContentCreator, getCategories } from "@/lib/supabase/dal";
import { EditPlaylistForm } from "./edit-playlist-form";

export default async function EditPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/playlists/${id}/edit`);

  const supabase = await createClient();
  // No app-level ownership filter: RLS already limits this to the
  // playlist's own teacher or a fellow institution-member teacher.
  const { data: playlist } = await supabase
    .from("playlist")
    .select(
      "id, title, description, category_id, price, thumbnail_url, is_published"
    )
    .eq("id", id)
    .single();

  if (!playlist) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit playlist</h1>
          <p className="mt-1 text-sm text-neutral-500">{playlist.title}</p>
        </div>
        <Link
          href={`/playlists/${playlist.id}`}
          className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Link>
      </div>
      <EditPlaylistForm playlist={playlist} categories={categories} />
    </div>
  );
}

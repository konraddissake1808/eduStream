import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/currency";

type PlaylistRow = {
  id: string;
  title: string;
  price: number;
  category: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

export default async function PlaylistsCatalogPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("playlist")
    .select(
      "id, title, price, category(name), teacher:profiles!playlist_teacher_id_fkey(full_name)"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const playlists = (data ?? []) as unknown as PlaylistRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Playlists</h1>

      {!playlists.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          No playlists are available yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {playlists.map((playlist) => (
            <li key={playlist.id} className="px-4 py-3">
              <Link
                href={`/playlists/${playlist.id}`}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                {playlist.title}
              </Link>
              <p className="mt-1 text-xs text-neutral-500">
                {playlist.category?.name ?? "Uncategorized"}
                {playlist.teacher?.full_name
                  ? ` · by ${playlist.teacher.full_name}`
                  : ""}{" "}
                · {playlist.price > 0 ? formatPrice(playlist.price) : "Free"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  requireContentCreator,
  getMyInstitutionMemberships,
} from "@/lib/supabase/dal";
import { formatPrice } from "@/lib/currency";

type PlaylistRow = {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  category: { name: string } | null;
};

export default async function PlaylistsPage() {
  const creator = await requireContentCreator("/dashboard/playlists");
  const supabase = await createClient();

  // Show content this account authored directly, plus anything attributed
  // to an institution it's part of (as the institution itself, or as one
  // of that institution's member teachers).
  const institutionIds =
    creator.role === "institution"
      ? [creator.id]
      : (await getMyInstitutionMemberships()).map((m) => m.institution.id);

  const orFilter = institutionIds.length
    ? `teacher_id.eq.${creator.id},institution_id.in.(${institutionIds.join(",")})`
    : `teacher_id.eq.${creator.id}`;

  const { data } = await supabase
    .from("playlist")
    .select("id, title, price, is_published, category(name)")
    .or(orFilter)
    .order("created_at", { ascending: false });

  const playlists = (data ?? []) as unknown as PlaylistRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your playlists</h1>
        <Link
          href="/dashboard/playlists/new"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New playlist
        </Link>
      </div>

      {!playlists?.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          You haven&apos;t created any playlists yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{playlist.title}</p>
                <p className="text-xs text-neutral-500">
                  {playlist.category?.name ?? "Uncategorized"} ·{" "}
                  {playlist.price > 0 ? formatPrice(playlist.price) : "Free"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    playlist.is_published
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {playlist.is_published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/dashboard/playlists/${playlist.id}/content`}
                  className="text-sm font-medium underline"
                >
                  Content
                </Link>
                <Link
                  href={`/dashboard/playlists/${playlist.id}/live`}
                  className="text-sm font-medium underline"
                >
                  Live
                </Link>
                <Link
                  href={`/dashboard/playlists/${playlist.id}/edit`}
                  className="text-sm font-medium underline"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

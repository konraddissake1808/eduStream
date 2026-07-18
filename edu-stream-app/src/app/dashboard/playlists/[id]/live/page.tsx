import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  requireContentCreator,
  getMyInstitutionMemberships,
} from "@/lib/supabase/dal";
import { reconcilePendingRecordings } from "@/lib/live-session";
import { StartSessionForm } from "./start-session-form";

type SessionRow = {
  id: string;
  title: string;
  status: string;
  started_at: string;
  recording_status: string;
};

export default async function PlaylistLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContentCreator(`/dashboard/playlists/${id}/live`);

  const supabase = await createClient();

  // No app-level ownership filter: RLS already limits this to the
  // playlist's own teacher or a fellow institution-member teacher.
  const { data: playlist } = await supabase
    .from("playlist")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!playlist) {
    notFound();
  }

  await reconcilePendingRecordings({ playlistIds: [id] });

  const [{ data }, memberships] = await Promise.all([
    supabase
      .from("live_session")
      .select("id, title, status, started_at, recording_status")
      .eq("playlist_id", id)
      .order("started_at", { ascending: false }),
    getMyInstitutionMemberships(),
  ]);

  const sessions = (data ?? []) as unknown as SessionRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{playlist.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">Live sessions</p>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Start a session</h2>
        <div className="mt-3">
          <StartSessionForm
            playlistId={playlist.id}
            institutions={memberships.map((m) => m.institution)}
          />
        </div>
      </div>

      {sessions.length > 0 && (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{session.title}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(session.started_at).toLocaleString()}
                </p>
              </div>
              {session.status === "live" ? (
                <Link
                  href={`/live/${session.id}`}
                  className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                >
                  Live &middot; Join
                </Link>
              ) : session.recording_status === "ready" ? (
                <Link
                  href={`/live/${session.id}`}
                  className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Watch recording
                </Link>
              ) : (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  Ended
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

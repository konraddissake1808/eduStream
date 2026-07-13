import { requireContentCreator } from "@/lib/supabase/dal";

export default async function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireContentCreator("/dashboard/playlists");

  return <>{children}</>;
}

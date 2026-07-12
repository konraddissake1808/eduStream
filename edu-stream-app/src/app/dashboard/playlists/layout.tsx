import { requireTeacher } from "@/lib/supabase/dal";

export default async function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher("/dashboard/playlists");

  return <>{children}</>;
}

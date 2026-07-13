import { requireContentCreator } from "@/lib/supabase/dal";

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireContentCreator("/dashboard/courses");

  return <>{children}</>;
}

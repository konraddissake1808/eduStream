import { requireTeacher } from "@/lib/supabase/dal";

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher("/dashboard/courses");

  return <>{children}</>;
}

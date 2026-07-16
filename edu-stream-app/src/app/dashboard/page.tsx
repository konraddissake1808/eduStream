import { requireProfile } from "@/lib/supabase/dal";
import { TeacherDashboard } from "./teacher-dashboard";
import { StudentDashboard } from "./student-dashboard";
import { InstitutionDashboard } from "./institution-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const profile = await requireProfile("/dashboard");

  if (profile.role === "teacher") {
    return <TeacherDashboard profile={profile} />;
  }

  if (profile.role === "student") {
    const { category } = await searchParams;
    return <StudentDashboard profile={profile} categoryFilter={category} />;
  }

  return <InstitutionDashboard institution={profile} />;
}

import { requireProfile } from "@/lib/supabase/dal";
import { TeacherDashboard } from "./teacher-dashboard";
import { StudentDashboard } from "./student-dashboard";
import { InstitutionDashboard } from "./institution-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; lessonCategory?: string }>;
}) {
  const profile = await requireProfile("/dashboard");

  if (profile.role === "teacher") {
    return <TeacherDashboard profile={profile} />;
  }

  if (profile.role === "student") {
    const { category, lessonCategory } = await searchParams;
    return (
      <StudentDashboard
        studentId={profile.id}
        categoryFilter={category}
        lessonCategoryFilter={lessonCategory}
      />
    );
  }

  return <InstitutionDashboard institution={profile} />;
}

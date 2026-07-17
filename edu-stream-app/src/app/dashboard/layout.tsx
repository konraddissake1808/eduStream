import { requireProfile } from "@/lib/supabase/dal";
import { TeacherSidebar } from "./teacher-dashboard";
import { StudentSidebar } from "./student-dashboard";
import { InstitutionSidebar } from "./institution-dashboard";

// The sidebar lives here, once, so it persists across every /dashboard/*
// route instead of each page re-rendering its own copy — navigating
// between e.g. "My Courses" and a course's "Live Sessions" page only
// swaps the content on the right, the same way it would within a single
// page, instead of feeling like leaving the dashboard entirely.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile("/dashboard");

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      {profile.role === "teacher" && <TeacherSidebar profile={profile} />}
      {profile.role === "student" && <StudentSidebar profile={profile} />}
      {profile.role === "institution" && (
        <InstitutionSidebar institution={profile} />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

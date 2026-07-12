import { requireProfile } from "@/lib/supabase/dal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile("/dashboard");

  return <>{children}</>;
}

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  return data;
});

// Defense in depth: the proxy already redirects unauthenticated requests
// away from protected routes, but Server Actions/Route Handlers can be
// reached directly, so pages under those routes should call this too.
export async function requireProfile(nextPath?: string) {
  const profile = await getProfile();

  if (!profile) {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${query}`);
  }

  return profile;
}

export async function requireExactRole(
  role: "student" | "teacher" | "institution",
  nextPath?: string
) {
  const profile = await requireProfile(nextPath);

  if (profile.role !== role) {
    redirect("/dashboard");
  }

  return profile;
}

// Teachers and institutions can both author courses/playlists.
export async function requireContentCreator(nextPath?: string) {
  const profile = await requireProfile(nextPath);

  if (profile.role !== "teacher" && profile.role !== "institution") {
    redirect("/dashboard");
  }

  return profile;
}

export async function requireInstitution(nextPath?: string) {
  return requireExactRole("institution", nextPath);
}

export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("category")
    .select("id, name")
    .order("name");

  return data ?? [];
});

// Institutions a teacher is a member of, used to attribute new content to
// an institution instead of (or in addition to) themselves.
export const getMyInstitutionMemberships = cache(async () => {
  const profile = await getProfile();
  if (!profile || profile.role !== "teacher") return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("institution_member")
    .select("institution:institution_id(id, full_name)")
    .eq("teacher_id", profile.id);

  return (data ?? []) as unknown as {
    institution: { id: string; full_name: string | null };
  }[];
});

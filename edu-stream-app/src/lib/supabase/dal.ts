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

export async function requireTeacher(nextPath?: string) {
  const profile = await requireProfile(nextPath);

  if (profile.role !== "teacher") {
    redirect("/dashboard");
  }

  return profile;
}

export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("category")
    .select("id, name")
    .order("name");

  return data ?? [];
});

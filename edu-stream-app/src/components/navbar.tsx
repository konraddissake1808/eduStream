import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="flex h-16 w-full items-center justify-between border-b border-neutral-200 px-6">
      <Link href="/" className="text-lg font-semibold">
        eduStream
      </Link>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600">
            {profile?.full_name ?? user.email}
            {profile?.role && (
              <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-500">
                {profile.role}
              </span>
            )}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="font-medium">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-black px-3 py-1.5 font-medium text-white"
          >
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}

import { createClient } from "@/lib/supabase/server";
import { requireExactRole } from "@/lib/supabase/dal";
import { joinInstitution, leaveInstitution } from "./actions";

type Institution = { id: string; full_name: string | null };

export default async function MyInstitutionsPage() {
  const profile = await requireExactRole("teacher", "/dashboard/my-institutions");
  const supabase = await createClient();

  const [{ data: institutions }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "institution")
      .order("full_name"),
    supabase
      .from("institution_member")
      .select("institution_id")
      .eq("teacher_id", profile.id),
  ]);

  const memberIds = new Set(
    (memberships ?? []).map((m) => m.institution_id as string)
  );
  const allInstitutions = (institutions ?? []) as Institution[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">My institutions</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Join an institution to help manage its courses and playlists.
      </p>

      {!allInstitutions.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          No institutions have signed up yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {allInstitutions.map((institution) => {
            const isMember = memberIds.has(institution.id);

            return (
              <li
                key={institution.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {institution.full_name ?? "Institution"}
                </span>
                <form
                  action={
                    isMember
                      ? leaveInstitution.bind(null, institution.id)
                      : joinInstitution.bind(null, institution.id)
                  }
                >
                  <button
                    type="submit"
                    className={
                      isMember
                        ? "text-sm font-medium text-red-600 underline"
                        : "rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
                    }
                  >
                    {isMember ? "Leave" : "Join"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

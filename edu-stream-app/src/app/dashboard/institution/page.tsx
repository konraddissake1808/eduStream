import { createClient } from "@/lib/supabase/server";
import { requireInstitution } from "@/lib/supabase/dal";
import { removeMember } from "./actions";

type MemberRow = {
  id: string;
  teacher: { id: string; full_name: string | null } | null;
};

export default async function InstitutionMembersPage() {
  const institution = await requireInstitution("/dashboard/institution");
  const supabase = await createClient();

  const { data } = await supabase
    .from("institution_member")
    .select("id, teacher:teacher_id(id, full_name)")
    .eq("institution_id", institution.id)
    .order("created_at", { ascending: false });

  const members = (data ?? []) as unknown as MemberRow[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Teacher members</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Any teacher listed here can create and manage courses/playlists
        posted as {institution.full_name ?? "your institution"}.
      </p>

      {!members.length ? (
        <p className="mt-8 text-sm text-neutral-500">
          No teachers have joined yet. Teachers can join from their
          dashboard&apos;s{" "}
          <span className="font-medium">My institutions</span> page.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium">
                {member.teacher?.full_name ?? "Unknown teacher"}
              </span>
              <form action={removeMember.bind(null, member.id)}>
                <button
                  type="submit"
                  className="text-sm font-medium text-red-600 underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

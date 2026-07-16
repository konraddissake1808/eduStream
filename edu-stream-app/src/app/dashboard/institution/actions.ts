"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInstitution } from "@/lib/supabase/dal";

export async function removeMember(memberId: string) {
  const institution = await requireInstitution("/dashboard/institution");
  const supabase = await createClient();

  await supabase
    .from("institution_member")
    .delete()
    .eq("id", memberId)
    .eq("institution_id", institution.id);

  revalidatePath("/dashboard/institution");
  revalidatePath("/dashboard");
}

export type AddMemberState =
  | { error: string }
  | { success: true; name: string }
  | undefined;

export async function addMemberByEmail(
  _prevState: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  const institution = await requireInstitution("/dashboard/institution");

  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  const { data: matches, error: lookupError } = await supabase.rpc(
    "find_teacher_by_email",
    { lookup_email: email.trim().toLowerCase() }
  );

  if (lookupError) {
    return { error: lookupError.message };
  }

  const teacher = matches?.[0];
  if (!teacher) {
    return { error: "No teacher account found with that email." };
  }

  const { error } = await supabase.from("institution_member").insert({
    institution_id: institution.id,
    teacher_id: teacher.id,
  });

  // 23505 = unique violation, i.e. already a member: treat as success.
  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  revalidatePath("/dashboard/institution");
  revalidatePath("/dashboard");
  return { success: true, name: teacher.full_name ?? email.trim() };
}

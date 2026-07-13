"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireExactRole } from "@/lib/supabase/dal";

export async function joinInstitution(institutionId: string) {
  const profile = await requireExactRole("teacher", "/dashboard/my-institutions");
  const supabase = await createClient();

  await supabase.from("institution_member").insert({
    institution_id: institutionId,
    teacher_id: profile.id,
  });

  revalidatePath("/dashboard/my-institutions");
}

export async function leaveInstitution(institutionId: string) {
  const profile = await requireExactRole("teacher", "/dashboard/my-institutions");
  const supabase = await createClient();

  await supabase
    .from("institution_member")
    .delete()
    .eq("institution_id", institutionId)
    .eq("teacher_id", profile.id);

  revalidatePath("/dashboard/my-institutions");
}

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
}

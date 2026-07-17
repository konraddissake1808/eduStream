"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";

// No revalidatePath: the bell manages its own read-state locally for an
// immediate UI update, and the next natural navigation re-fetches fresh
// data anyway (see the same reasoning on the enroll actions).
export async function markNotificationsRead() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("notification")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
}

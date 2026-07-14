import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. Server-only — never import
// this from a Client Component or anywhere its module graph could reach
// the browser bundle. Used for lesson video storage, where authorization
// is checked by the caller (via normal RLS-scoped queries) before this
// client ever touches Storage.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isDemoMode } from "@/lib/demo/mode";
import { createFakeClient } from "@/lib/demo/fake-supabase";

/**
 * Service-role client. Bypasses RLS — only use from trusted server-side
 * contexts (file uploads, the AI analysis run, the public share route),
 * never from a request handler that echoes user-supplied filters back into
 * a query.
 */
export function createAdminClient() {
  if (isDemoMode()) {
    return createFakeClient() as unknown as ReturnType<typeof createSupabaseClient<Database>>;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

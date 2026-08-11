/**
 * Demo mode swaps Supabase (auth + data) and the Anthropic AI call for an
 * in-memory fake, so the app can be clicked through without provisioning a
 * real Supabase project or Anthropic API key. Off by default — the real
 * implementation is untouched unless DEMO_MODE=1 is set.
 *
 * It also bypasses auth entirely (proxy.ts treats every route as public),
 * so it is hard-disabled outside development even if DEMO_MODE=1 leaks into
 * a production environment's config by mistake.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1" && process.env.NODE_ENV !== "production";
}

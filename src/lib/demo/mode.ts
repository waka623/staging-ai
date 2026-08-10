/**
 * Demo mode swaps Supabase (auth + data) and the Anthropic AI call for an
 * in-memory fake, so the app can be clicked through without provisioning a
 * real Supabase project or Anthropic API key. Off by default — the real
 * implementation is untouched unless DEMO_MODE=1 is set.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1";
}

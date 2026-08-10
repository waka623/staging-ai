import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

/**
 * Resolves the company owned by the signed-in user. Every dashboard page is
 * scoped to exactly one company per owner for the MVP, so this is the single
 * entry point pages use to get both the authenticated user and their company.
 */
export async function requireCurrentCompany(): Promise<{
  userId: string;
  company: Company;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error || !company) {
    redirect("/login");
  }

  return { userId: user.id, company };
}

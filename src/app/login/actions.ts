"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo/mode";

export type AuthFormState = { error: string | null };

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  redirect("/dashboard");
}

export async function logout() {
  if (isDemoMode()) {
    // No real session to end in demo mode — proxy.ts leaves every route open.
    redirect("/dashboard");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

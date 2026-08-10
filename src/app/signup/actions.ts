"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthFormState } from "@/app/login/actions";

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!email || !password || !companyName) {
    return { error: "すべての項目を入力してください" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }
  if (!data.user) {
    return { error: "登録に失敗しました。時間をおいて再度お試しください" };
  }

  // Create the company row with the service-role client: signUp() may not
  // establish a session yet (e.g. when email confirmation is required), so
  // the RLS-scoped server client can't authenticate as the new user.
  const admin = createAdminClient();
  const { error: companyError } = await admin
    .from("companies")
    .insert({ owner_id: data.user.id, name: companyName, plan: "trial" });

  if (companyError) {
    return { error: `会社情報の作成に失敗しました: ${companyError.message}` };
  }

  if (!data.session) {
    redirect("/login?confirm=1");
  }

  redirect("/dashboard");
}

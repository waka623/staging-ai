"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass } from "@/components/ui/field";
import { IconAlertTriangle, IconSpinner } from "@/components/icons";
import { signup } from "./actions";
import type { AuthFormState } from "@/app/login/actions";

const initialState: AuthFormState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthShell
      title="新規登録"
      subtitle="会社アカウントを作成して、無料お試し（初回1物件）を始めましょう"
      footer={
        <>
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            ログイン
          </Link>
        </>
      }
    >
      <form action={formAction} className="mt-6 space-y-4">
        <Field label="会社名" htmlFor="companyName" hint="例: ○○不動産管理株式会社">
          <input id="companyName" name="companyName" required className={inputClass} />
        </Field>
        <Field label="メールアドレス" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </Field>
        <Field label="パスワード" htmlFor="password" hint="8文字以上">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        {state.error && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
            <IconAlertTriangle className="h-4 w-4 shrink-0" />
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:bg-teal-300"
        >
          {pending && <IconSpinner className="h-4 w-4 animate-spin" />}
          {pending ? "登録中..." : "登録する"}
        </button>
      </form>
    </AuthShell>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";
import { IconAlertTriangle, IconSpinner } from "@/components/icons";
import { createProperty, idlePropertyState } from "../actions";

function ProcessingNotice() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
      <IconSpinner className="h-4 w-4 shrink-0 animate-spin" />
      間取り・写真を解析しています…（数十秒かかることがあります）
    </div>
  );
}

export default function NewPropertyPage() {
  const [state, formAction] = useActionState(createProperty, idlePropertyState);

  return (
    <div className="space-y-6">
      <PageHeader title="物件（案件）登録" subtitle="間取り図と空室写真から、AIが家具配置プランを提案します" />

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <Field label="物件名・メモ" htmlFor="name">
            <input id="name" name="name" required placeholder="例: ○○マンション 302号室" className={inputClass} />
          </Field>
          <Field label="メモ（任意）" htmlFor="memo">
            <textarea id="memo" name="memo" rows={2} className={inputClass} />
          </Field>

          <Field
            label="間取り図（1枚）"
            htmlFor="floorPlan"
            hint="JPEG / PNG / WebP 形式に対応しています"
          >
            <input
              id="floorPlan"
              name="floorPlan"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="mt-1 block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-800 hover:file:bg-teal-100"
            />
          </Field>

          <Field
            label="空室写真（複数枚）"
            htmlFor="photos"
            hint="部屋ごとに1枚以上、最大8枚まで"
          >
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
              className="mt-1 block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-800 hover:file:bg-teal-100"
            />
          </Field>

          {state.status === "error" && state.message && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
              <IconAlertTriangle className="h-4 w-4 shrink-0" />
              {state.message}
            </p>
          )}

          <ProcessingNotice />

          <SubmitButton pendingText="アップロード中...">
            アップロードしてAI解析を開始
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}

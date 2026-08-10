"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { IconRefresh } from "@/components/icons";
import { idleState } from "@/lib/action-state";
import { regenerateProposals } from "../actions";

export function RegenerateButton({ propertyId }: { propertyId: string }) {
  const [, formAction] = useActionState(regenerateProposals, idleState);

  return (
    <form action={formAction}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <SubmitButton variant="secondary" size="sm" pendingText="再解析中...">
        <IconRefresh className="h-3.5 w-3.5" />
        再生成
      </SubmitButton>
    </form>
  );
}

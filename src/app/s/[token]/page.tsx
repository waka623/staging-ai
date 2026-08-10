import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LayoutDiagram } from "@/components/layout-diagram";
import { Card, CardHeader } from "@/components/ui/card";
import { isDemoMode } from "@/lib/demo/mode";

export default async function SharedProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("*, properties(name)")
    .eq("share_token", token)
    .single();

  if (!proposal) notFound();

  const propertyName = (proposal.properties as unknown as { name: string } | null)?.name ?? "";

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      {isDemoMode() && (
        <div className="fixed inset-x-0 top-0 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          デモモード — ダミーデータで表示しています
        </div>
      )}
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            AIレイアウト提案
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">
            {propertyName} ・ {proposal.title}
          </h1>
          {proposal.summary && <p className="mt-2 text-sm text-stone-500">{proposal.summary}</p>}
        </div>

        <Card className="p-5">
          <LayoutDiagram layout={proposal.layout_data} />
        </Card>

        <Card>
          <CardHeader title="家具リスト" />
          <ul className="divide-y divide-stone-100">
            {proposal.layout_data.furniture.map((item) => {
              const room = proposal.layout_data.rooms.find((r) => r.id === item.roomId);
              return (
                <li key={item.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-stone-900">{item.label}</span>
                  <span className="text-stone-400">
                    {room?.name ?? "-"} ・ {item.width.toFixed(1)}m × {item.depth.toFixed(1)}m
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <p className="text-center text-xs text-stone-400">
          このレイアウトはAIによる提案であり、実際の家具サイズ・間取りとは異なる場合があります。
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentCompany } from "@/lib/auth/current-company";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { LayoutDiagram } from "@/components/layout-diagram";
import { PrintButton, ShareLinkButton } from "@/components/proposal-actions";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string; proposalId: string }>;
}) {
  const { id, proposalId } = await params;
  const { company } = await requireCurrentCompany();
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", id)
    .eq("company_id", company.id)
    .single();

  if (!property) notFound();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("property_id", id)
    .single();

  if (!proposal) notFound();

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link href={`/properties/${id}`} className="text-sm text-teal-700 hover:underline">
          ← {property.name} に戻る
        </Link>
      </div>

      <PageHeader
        title={`${property.name} ・ 案${proposal.pattern_key}: ${proposal.title}`}
        subtitle={proposal.summary ?? undefined}
        action={
          <div className="no-print flex gap-2">
            <PrintButton />
            <ShareLinkButton shareToken={proposal.share_token} />
          </div>
        }
      />

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
    </div>
  );
}

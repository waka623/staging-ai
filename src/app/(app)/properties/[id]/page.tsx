import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentCompany } from "@/lib/auth/current-company";
import { createClient } from "@/lib/supabase/server";
import { getSignedMediaUrls } from "@/lib/supabase/storage";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { IconAlertTriangle, IconImageOff } from "@/components/icons";
import type { PropertyStatus } from "@/types/database";
import { RegenerateButton } from "./regenerate-button";

const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: "未着手",
  processing: "解析中",
  completed: "提案済",
  failed: "失敗",
};

const STATUS_TONE: Record<PropertyStatus, "neutral" | "warning" | "brand" | "danger"> = {
  draft: "neutral",
  processing: "warning",
  completed: "brand",
  failed: "danger",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCurrentCompany();
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("company_id", company.id)
    .single();

  if (!property) notFound();

  const [{ data: photos }, { data: proposals }] = await Promise.all([
    supabase
      .from("property_photos")
      .select("id, url, sort_order")
      .eq("property_id", id)
      .order("sort_order"),
    supabase
      .from("proposals")
      .select("id, generation_id, pattern_key, title, summary, created_at")
      .eq("property_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const photoList = photos ?? [];
  const proposalList = proposals ?? [];
  const latestGenerationId = proposalList[0]?.generation_id ?? null;
  const currentProposals = proposalList.filter((p) => p.generation_id === latestGenerationId);
  const pastProposals = proposalList.filter((p) => p.generation_id !== latestGenerationId);

  const signedPhotoUrls = await getSignedMediaUrls(photoList.map((p) => p.url));

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        subtitle={`登録日: ${new Date(property.created_at).toLocaleDateString("ja-JP")}`}
        action={<Badge tone={STATUS_TONE[property.status]}>{STATUS_LABEL[property.status]}</Badge>}
      />

      {property.status === "failed" && (
        <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <IconAlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">AI解析に失敗しました</p>
            {property.status_error && <p className="mt-0.5 text-red-700">{property.status_error}</p>}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="空室写真" />
        {photoList.length === 0 ? (
          <EmptyState icon={<IconImageOff className="h-9 w-9" />} title="写真がありません" />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {photoList.map((photo) => {
              const src = signedPhotoUrls.get(photo.url);
              return (
                <div key={photo.id} className="aspect-video overflow-hidden rounded-lg bg-stone-100">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="空室写真" className="h-full w-full object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="提案一覧"
          action={
            (property.status === "completed" || property.status === "failed") && (
              <RegenerateButton propertyId={property.id} />
            )
          }
        />
        {currentProposals.length === 0 ? (
          <EmptyState
            title={property.status === "processing" ? "解析中です" : "まだ提案がありません"}
            description={
              property.status === "processing" ? "完了までしばらくお待ちください" : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            {currentProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/properties/${property.id}/proposals/${proposal.id}`}
                className="rounded-lg border border-stone-200 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                  案{proposal.pattern_key}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">{proposal.title}</p>
                {proposal.summary && (
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">{proposal.summary}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {pastProposals.length > 0 && (
        <Card>
          <CardHeader title="生成履歴" />
          <ul className="divide-y divide-stone-100">
            {pastProposals.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/properties/${property.id}/proposals/${proposal.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-stone-50"
                >
                  <div>
                    <p className="text-sm text-stone-900">
                      案{proposal.pattern_key} ・ {proposal.title}
                    </p>
                    <p className="text-xs text-stone-400">
                      {new Date(proposal.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

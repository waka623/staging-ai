import Link from "next/link";
import { requireCurrentCompany } from "@/lib/auth/current-company";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBuilding, IconPlus } from "@/components/icons";
import type { PropertyStatus } from "@/types/database";

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

export default async function DashboardPage() {
  const { company } = await requireCurrentCompany();
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, status, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const list = properties ?? [];
  const completedCount = list.filter((p) => p.status === "completed").length;
  const processingCount = list.filter((p) => p.status === "processing").length;

  const stats = [
    { label: "登録物件数", value: list.length },
    { label: "提案済", value: completedCount },
    { label: "解析中", value: processingCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="案件一覧"
        subtitle={`${company.name} の物件`}
        action={
          <Link href="/properties/new">
            <Button variant="primary">
              <IconPlus className="h-4 w-4" />
              新規物件登録
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">
              {stat.value}
              <span className="ml-1 text-base font-normal text-stone-400">件</span>
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="物件一覧" />
        {list.length === 0 ? (
          <EmptyState
            icon={<IconBuilding className="h-10 w-10" />}
            title="まだ物件が登録されていません"
            description="「新規物件登録」から間取り図と空室写真をアップロードしましょう"
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {list.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/properties/${property.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{property.name}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(property.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[property.status]}>
                    {STATUS_LABEL[property.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

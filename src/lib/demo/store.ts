import type { Company, Generation, Property, PropertyPhoto, Proposal } from "@/types/database";
import { synthesizeProposals, layoutFor } from "./synthesize";

export type DemoStore = {
  companies: Company[];
  properties: Property[];
  propertyPhotos: PropertyPhoto[];
  generations: Generation[];
  proposals: Proposal[];
};

const GLOBAL_KEY = "__staging_ai_demo_store__";
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: DemoStore };

export const DEMO_COMPANY_ID = "demo-company";

function seed(): DemoStore {
  const now = new Date().toISOString();
  const propertyId = "demo-property-1";
  const generationId = "demo-generation-1";

  const { rooms, proposals: drafts } = synthesizeProposals();

  const proposals: Proposal[] = drafts.map((draft) => ({
    id: `demo-proposal-${draft.patternKey.toLowerCase()}`,
    generation_id: generationId,
    property_id: propertyId,
    pattern_key: draft.patternKey,
    title: draft.title,
    summary: draft.summary,
    layout_data: layoutFor(rooms, draft.furniture),
    share_token: `demo-share-${draft.patternKey.toLowerCase()}`,
    created_at: now,
  }));

  return {
    companies: [
      {
        id: DEMO_COMPANY_ID,
        owner_id: "demo-user",
        name: "デモ不動産管理株式会社",
        plan: "trial",
        created_at: now,
      },
    ],
    properties: [
      {
        id: propertyId,
        company_id: DEMO_COMPANY_ID,
        name: "○○マンション 302号室（デモ）",
        memo: "これはデモモードのサンプルデータです",
        floor_plan_url: null,
        status: "completed",
        status_error: null,
        created_at: now,
      },
    ],
    propertyPhotos: [],
    generations: [
      {
        id: generationId,
        property_id: propertyId,
        status: "completed",
        error_message: null,
        created_at: now,
        completed_at: now,
      },
    ],
    proposals,
  };
}

export function getDemoStore(): DemoStore {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = seed();
  }
  return g[GLOBAL_KEY];
}

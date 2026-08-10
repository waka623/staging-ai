import type { LayoutData } from "@/types/layout";

export type CompanyPlan = "trial" | "payg" | "light" | "standard";
export type PropertyStatus = "draft" | "processing" | "completed" | "failed";
export type GenerationStatus = "processing" | "completed" | "failed";

// Row shapes use `type` rather than `interface`: TypeScript only synthesizes
// the implicit index signature that `Record<string, GenericTable>` (used by
// @supabase/postgrest-js's generic constraints) needs during conditional
// `extends` checks for object-literal type aliases, not for interfaces. An
// interface here silently makes every query resolve to `never`.
export type Company = {
  id: string;
  owner_id: string;
  name: string;
  plan: CompanyPlan;
  created_at: string;
};

export type Property = {
  id: string;
  company_id: string;
  name: string;
  memo: string | null;
  floor_plan_url: string | null;
  status: PropertyStatus;
  status_error: string | null;
  created_at: string;
};

export type PropertyPhoto = {
  id: string;
  property_id: string;
  url: string;
  sort_order: number;
  created_at: string;
};

export type Generation = {
  id: string;
  property_id: string;
  status: GenerationStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type Proposal = {
  id: string;
  generation_id: string;
  property_id: string;
  pattern_key: string;
  title: string;
  summary: string | null;
  layout_data: LayoutData;
  share_token: string;
  created_at: string;
};

/** Row fields with a database default (id, created_at, ...) are optional on insert. */
type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required>>;

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, InsertRequired extends keyof Row, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Insertable<Row, InsertRequired>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      companies: Table<Company, "owner_id" | "name">;
      properties: Table<Property, "company_id" | "name">;
      property_photos: Table<
        PropertyPhoto,
        "property_id" | "url",
        [
          {
            foreignKeyName: "property_photos_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ]
      >;
      generations: Table<
        Generation,
        "property_id",
        [
          {
            foreignKeyName: "generations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ]
      >;
      proposals: Table<
        Proposal,
        "generation_id" | "property_id" | "pattern_key" | "title" | "layout_data",
        [
          {
            foreignKeyName: "proposals_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "generations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

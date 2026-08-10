import { getDemoStore, type DemoStore } from "./store";

type TableName = "companies" | "properties" | "property_photos" | "generations" | "proposals";

const TABLE_KEY: Record<TableName, keyof DemoStore> = {
  companies: "companies",
  properties: "properties",
  property_photos: "propertyPhotos",
  generations: "generations",
  proposals: "proposals",
};

const DEFAULTS_BY_TABLE: Record<TableName, Record<string, unknown>> = {
  companies: {},
  properties: { status: "draft", memo: null, floor_plan_url: null, status_error: null },
  property_photos: { sort_order: 0 },
  generations: { status: "processing", error_message: null, completed_at: null },
  proposals: { summary: null },
};

type Row = Record<string, unknown>;
type QueryResult = { data: unknown; error: { message: string } | null };

/**
 * Minimal stand-in for the subset of the supabase-js query builder this
 * codebase actually calls (.select/.eq/.order/.single/.insert/.update, plus
 * the `.then()` thenable so `await` works). Not a general-purpose mock —
 * only the chains used in this app are implemented.
 */
class DemoQueryBuilder implements PromiseLike<QueryResult> {
  private filters: { col: string; val: unknown }[] = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private singleFlag = false;
  private mode: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] | null = null;
  private returnAfterWrite = false;

  constructor(private table: TableName) {}

  select(_columns?: string) {
    this.returnAfterWrite = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  single() {
    this.singleFlag = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mode = "insert";
    this.payload = rows;
    return this;
  }

  update(patch: Row) {
    this.mode = "update";
    this.payload = patch;
    return this;
  }

  private array(): Row[] {
    return getDemoStore()[TABLE_KEY[this.table]] as unknown as Row[];
  }

  private matches(row: Row) {
    return this.filters.every((f) => row[f.col] === f.val);
  }

  private execute(): QueryResult {
    const arr = this.array();

    if (this.mode === "insert") {
      const rowsIn = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const now = new Date().toISOString();
      const inserted = rowsIn.map((r) => ({
        id: crypto.randomUUID(),
        created_at: now,
        ...DEFAULTS_BY_TABLE[this.table],
        ...r,
      }));
      arr.push(...inserted);
      if (this.returnAfterWrite) {
        return { data: this.singleFlag ? inserted[0] ?? null : inserted, error: null };
      }
      return { data: null, error: null };
    }

    if (this.mode === "update") {
      const patch = this.payload as Row;
      for (const row of arr) {
        if (this.matches(row)) Object.assign(row, patch);
      }
      return { data: null, error: null };
    }

    let rows = arr.filter((r) => this.matches(r));
    if (this.orderCol) {
      const col = this.orderCol;
      rows = [...rows].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return this.orderAsc ? cmp : -cmp;
      });
    }

    // Special-case the `proposals` -> `properties(name)` join used by the
    // public share page; nothing else in this app selects a relation.
    if (this.table === "proposals") {
      const properties = getDemoStore().properties as unknown as Row[];
      rows = rows.map((r) => {
        const property = properties.find((p) => p.id === r.property_id);
        return { ...r, properties: property ? { name: property.name } : null };
      });
    }

    if (this.singleFlag) {
      return { data: rows[0] ?? null, error: rows[0] ? null : { message: "対象のデータが見つかりません" } };
    }
    return { data: rows, error: null };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export function createFakeClient() {
  return {
    from(table: TableName) {
      return new DemoQueryBuilder(table);
    },
  };
}

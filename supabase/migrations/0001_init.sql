-- Core schema for the vacant-room virtual staging SaaS.
-- Run via `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies: one row per real-estate brokerage / management company account
-- (the "owner" is the authenticated user who signs up). `plan` tracks the
-- pricing tier from the requirements memo; billing enforcement itself is a
-- follow-up (see README) so this column is informational for now.
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  plan text not null default 'trial' check (plan in ('trial', 'payg', 'light', 'standard')),
  created_at timestamptz not null default now()
);

create index if not exists companies_owner_id_idx on companies (owner_id);

-- ---------------------------------------------------------------------------
-- properties: one row per vacant unit (the "案件" from the requirements
-- memo). status tracks where it is in the AI analysis flow.
-- ---------------------------------------------------------------------------
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  memo text,
  floor_plan_url text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  status_error text,
  created_at timestamptz not null default now()
);

create index if not exists properties_company_id_idx on properties (company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- property_photos: the vacant-room photos uploaded alongside the floor plan.
-- ---------------------------------------------------------------------------
create table if not exists property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_photos_property_id_idx on property_photos (property_id, sort_order);

-- ---------------------------------------------------------------------------
-- generations: one row per AI analysis run for a property (the initial run,
-- plus any "再生成" reruns). A property can have multiple generations; each
-- generation produces up to 3 proposals (the plan's included pattern count).
-- ---------------------------------------------------------------------------
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists generations_property_id_idx on generations (property_id, created_at desc);

-- ---------------------------------------------------------------------------
-- proposals: one row per generated layout pattern. layout_data is the
-- structured room + furniture placement JSON the AI returns — the SVG
-- overhead diagram (Phase 1) and, later, the 3D view (Phase 3) both render
-- from this same document instead of a flat image.
-- share_token backs the public "共有リンク" (read via the admin client from
-- an unauthenticated route, not via an RLS policy — see /s/[token]).
-- ---------------------------------------------------------------------------
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  pattern_key text not null,
  title text not null,
  summary text,
  layout_data jsonb not null,
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (share_token)
);

create index if not exists proposals_generation_id_idx on proposals (generation_id);
create index if not exists proposals_property_id_idx on proposals (property_id, created_at desc);
create index if not exists proposals_share_token_idx on proposals (share_token);

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is scoped to the company(ies) owned by the
-- authenticated user. Service-role access (AI analysis server action, public
-- share route) bypasses RLS entirely, so these policies only govern the
-- authenticated dashboard UI.
-- ---------------------------------------------------------------------------
alter table companies enable row level security;
alter table properties enable row level security;
alter table property_photos enable row level security;
alter table generations enable row level security;
alter table proposals enable row level security;

create policy "owners can manage their companies"
  on companies for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners can manage their properties"
  on properties for all
  using (company_id in (select id from companies where owner_id = auth.uid()))
  with check (company_id in (select id from companies where owner_id = auth.uid()));

create policy "owners can manage their property photos"
  on property_photos for all
  using (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ))
  with check (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ));

create policy "owners can manage their generations"
  on generations for all
  using (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ))
  with check (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ));

create policy "owners can manage their proposals"
  on proposals for all
  using (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ))
  with check (property_id in (
    select id from properties where company_id in (
      select id from companies where owner_id = auth.uid()
    )
  ));

-- ---------------------------------------------------------------------------
-- Storage: floor plans and vacant-room photos live in a private bucket.
-- Objects are keyed as `${company_id}/${property_id}/${filename}`. Uploads
-- and the AI analysis read happen through the service-role client (see
-- lib/supabase/admin.ts), so these policies only need to cover the
-- authenticated dashboard viewing a property's own photos.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', false)
on conflict (id) do nothing;

create policy "owners can read their property media"
  on storage.objects for select
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1]::uuid in (
      select id from companies where owner_id = auth.uid()
    )
  );

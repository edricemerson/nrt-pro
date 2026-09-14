-- 0001_categories_and_products.sql
--
-- Backs the admin product pages (/admin/products, /admin/products/new,
-- /admin/products/[id]) and the public catalog.
--
-- Mirrors the `Product` and `Category` types in src/lib/types.ts. Money is a
-- bigint number of rupiah - never a float, so totals cannot drift.
--
-- Categories keep their human-readable slug as the primary key ("mesin-potong")
-- because the frontend already types them as a string union (CategoryId) and
-- uses them in URLs. Products get a uuid so ids are not guessable.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy search on the admin list

/* ------------------------------------------------------------- categories -- */

create table if not exists categories (
  id          text primary key,
  name        text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

comment on table categories is
  'Product categories from the NRTPRO price list. Seeded from src/lib/categories.ts.';

/* --------------------------------------------------------------- products -- */

create table if not exists products (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  sku         text        not null unique,
  name        text        not null,
  -- Short spec line from the price list, e.g. "Paku: F Max:30mm".
  spec        text        not null default '',
  -- Manufacturer type code as printed in the catalog, e.g. "F30 HD".
  type_code   text        not null default '',
  category_id text        not null
    references categories (id) on update cascade on delete restrict,
  -- Selling price in whole rupiah.
  price       bigint      not null default 0 check (price >= 0),
  stock       integer     not null default 10 check (stock >= 0),
  -- Units per carton, from the price list.
  pack_qty    integer     not null default 1 check (pack_qty > 0),
  pack_unit   text        not null default 'pcs' check (pack_unit in ('pcs', 'set')),
  description text        not null default '',
  -- Public URLs (Supabase Storage). Element 0 is the thumbnail.
  images      text[]      not null default '{}',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column products.stock is
  'Units on hand. Decremented in the same transaction that creates an order.';

-- The catalog filters by category and hides inactive rows; the admin list does
-- neither, so keep the category index unpartitioned and add a partial one for
-- the storefront.
create index if not exists products_category_id_idx on products (category_id);
create index if not exists products_active_idx      on products (active) where active;
create index if not exists products_created_at_idx  on products (created_at desc);

-- Admin search matches name, spec and sku with a substring query.
create index if not exists products_search_trgm_idx
  on products using gin ((name || ' ' || spec || ' ' || sku) gin_trgm_ops);

/* ----------------------------------------------------------- updated_at -- */

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

/* ---------------------------------------------------------------- policies -- */

-- Supabase exposes tables over PostgREST, so RLS must be on or anyone with the
-- anon key could rewrite prices.
alter table categories enable row level security;
alter table products   enable row level security;

-- Anyone may read the catalog. Inactive products stay hidden from the public.
-- Postgres has no `create policy if not exists`, so drop first to keep this
-- migration re-runnable alongside the `create table if not exists` above.
drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories
  for select using (true);

drop policy if exists products_public_read on products;
create policy products_public_read on products
  for select using (active);

-- No insert/update/delete policy is defined on purpose. Writes must go through
-- the Golang API using the service_role key, which bypasses RLS. Once
-- admin_users exists (see 0002), add policies keyed to it if you ever want the
-- admin UI to talk to Supabase directly.

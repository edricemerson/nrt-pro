-- 0002_customers_and_admins.sql
--
-- Backs the /masuk page (sign in + register) and gates /admin/*.
--
-- Passwords use bcrypt via pgcrypto's crypt()/gen_salt('bf'), NOT the SHA-256
-- the prototype currently does in the browser. Verify a login with:
--
--   select id from customers
--    where email = lower($1) and password_hash = crypt($2, password_hash);
--
-- crypt() re-reads the salt out of the stored hash, so this is a constant-time
-- bcrypt comparison, not a string equality test.

create extension if not exists pgcrypto;
create extension if not exists citext;   -- case-insensitive email

/* -------------------------------------------------------------- customers -- */

create table if not exists customers (
  id            uuid        primary key default gen_random_uuid(),
  email         citext      not null unique,
  password_hash text        not null,
  name          text        not null,
  -- Primary WhatsApp number. Kept on the account as well as on each address so
  -- there is always a number to call even if every address is deleted.
  phone         text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table customers is
  'Buyer accounts created on /masuk. Delivery details live in customer_addresses.';

/* ------------------------------------------------------ customer_addresses -- */

-- The register form offers Rumah / Kantor / Lainnya, which only makes sense if
-- a buyer can keep more than one address, so this is a separate table rather
-- than columns on customers.
create table if not exists customer_addresses (
  id             uuid        primary key default gen_random_uuid(),
  customer_id    uuid        not null
    references customers (id) on delete cascade,
  label          text        not null default 'rumah'
    check (label in ('rumah', 'kantor', 'lainnya')),
  -- Whoever actually receives the package; may differ from the account holder.
  recipient_name text        not null,
  phone          text        not null,
  -- Optional backup number, e.g. a satpam or family member.
  alt_phone      text        not null default '',
  -- Street, house number, RT/RW.
  address        text        not null,
  province       text        not null default '',
  city           text        not null default '',
  district       text        not null default '',
  postal_code    text        not null default '',
  -- Landmark for the courier, e.g. "pagar hijau, seberang masjid".
  courier_note   text        not null default '',
  -- GPS pin from the browser, when the buyer shares it. Null when they decline.
  lat            numeric(9, 6),
  lng            numeric(9, 6),
  is_default     boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Either both coordinates or neither; a lone lat is meaningless.
  constraint customer_addresses_coords_paired
    check ((lat is null) = (lng is null))
);

create index if not exists customer_addresses_customer_id_idx
  on customer_addresses (customer_id);

-- At most one default address per customer.
create unique index if not exists customer_addresses_one_default_idx
  on customer_addresses (customer_id) where is_default;

/* --------------------------------------------------------------- sessions -- */

-- Replaces writing a customer id into localStorage. Store only a hash of the
-- token so a database leak cannot be replayed as a login.
create table if not exists customer_sessions (
  id          uuid        primary key default gen_random_uuid(),
  customer_id uuid        not null references customers (id) on delete cascade,
  token_hash  text        not null unique,
  expires_at  timestamptz not null,
  user_agent  text        not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists customer_sessions_customer_id_idx
  on customer_sessions (customer_id);
create index if not exists customer_sessions_expires_at_idx
  on customer_sessions (expires_at);

/* ------------------------------------------------------------ admin_users -- */

create table if not exists admin_users (
  id            uuid        primary key default gen_random_uuid(),
  email         citext      not null unique,
  password_hash text        not null,
  name          text        not null,
  -- owner: everything, including managing other admins
  -- admin: products, stock, prices, orders
  -- staff: read-only plus order status changes
  role          text        not null default 'staff'
    check (role in ('owner', 'admin', 'staff')),
  active        boolean     not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists admin_sessions (
  id           uuid        primary key default gen_random_uuid(),
  admin_user_id uuid       not null references admin_users (id) on delete cascade,
  token_hash   text        not null unique,
  expires_at   timestamptz not null,
  user_agent   text        not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists admin_sessions_admin_user_id_idx
  on admin_sessions (admin_user_id);

/* ------------------------------------------------------------- updated_at -- */

-- set_updated_at() is created in 0001_categories_and_products.sql.
drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

drop trigger if exists customer_addresses_set_updated_at on customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on customer_addresses
  for each row execute function set_updated_at();

drop trigger if exists admin_users_set_updated_at on admin_users;
create trigger admin_users_set_updated_at
  before update on admin_users
  for each row execute function set_updated_at();

/* ---------------------------------------------------------------- policies -- */

-- RLS on with NO policies at all = deny everything through the anon and
-- authenticated keys, while service_role still bypasses it. That is what we
-- want: these tables hold password hashes and session tokens, so nothing here
-- may ever be reachable from the browser. All access goes through the API.
alter table customers          enable row level security;
alter table customer_addresses enable row level security;
alter table customer_sessions  enable row level security;
alter table admin_users        enable row level security;
alter table admin_sessions     enable row level security;

/* ------------------------------------------------------------ seed admin -- */

-- CHANGE THIS PASSWORD IMMEDIATELY AFTER YOUR FIRST LOGIN.
-- gen_salt('bf', 12) makes a bcrypt hash with cost 12; the plaintext below is
-- never stored, only its hash.
insert into admin_users (email, password_hash, name, role, active)
values (
  'edriceson@gmail.com',
  crypt('NrtPro!Admin2026', gen_salt('bf', 12)),
  'Owner',
  'owner',
  true
)
on conflict (email) do nothing;

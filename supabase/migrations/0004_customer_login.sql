-- 0004_customer_login.sql
--
-- Backs the Next.js Route Handlers under src/app/api/auth/* (register/login)
-- and src/app/api/customers/*/password (change password). Same pattern as
-- 0003_admin_login_and_stock.sql: password hashing/verification happens in
-- Postgres via pgcrypto, and EXECUTE is revoked from every PostgREST-facing
-- role except service_role - otherwise anyone with the anon key could call
-- these directly.

-- Hashes a plaintext password with bcrypt. Used on register and on password
-- change; kept as its own function so the salt/cost-factor logic lives in
-- exactly one place.
create or replace function hash_password(p_password text)
returns text
language sql
as $$
  select crypt(p_password, gen_salt('bf', 12));
$$;

revoke all on function hash_password(text) from public;
revoke all on function hash_password(text) from anon;
revoke all on function hash_password(text) from authenticated;
grant execute on function hash_password(text) to service_role;

-- Verifies a customer login and returns the public columns only -
-- password_hash must never leave Postgres.
create or replace function verify_customer_login(p_email citext, p_password text)
returns table (id uuid, email citext, name text, phone text, created_at timestamptz)
language sql
as $$
  select id, email, name, phone, created_at
  from customers
  where email = p_email
    and password_hash = crypt(p_password, password_hash)
  limit 1;
$$;

revoke all on function verify_customer_login(citext, text) from public;
revoke all on function verify_customer_login(citext, text) from anon;
revoke all on function verify_customer_login(citext, text) from authenticated;
grant execute on function verify_customer_login(citext, text) to service_role;

-- 0003_admin_login_and_stock.sql
--
-- Backs the Next.js Route Handlers under src/app/api/admin/auth (login) and
-- src/app/api/products (checkout stock decrement). Both are called only from
-- server-side code using the service_role key, so EXECUTE is revoked from every
-- PostgREST-facing role (public/anon/authenticated) and granted to service_role
-- only - otherwise anyone with the anon key could call these directly.

/* ------------------------------------------------------------ admin login -- */

-- Verifies an admin login and returns the public columns only - password_hash
-- must never leave Postgres, even to server-side code, so this does not
-- `select *` or `returns admin_users`.
create or replace function verify_admin_login(p_email citext, p_password text)
returns table (id uuid, email citext, name text, role text)
language sql
as $$
  select id, email, name, role
  from admin_users
  where email = p_email
    and active
    and password_hash = crypt(p_password, password_hash)
  limit 1;
$$;

revoke all on function verify_admin_login(citext, text) from public;
revoke all on function verify_admin_login(citext, text) from anon;
revoke all on function verify_admin_login(citext, text) from authenticated;
grant execute on function verify_admin_login(citext, text) to service_role;

/* -------------------------------------------------------- stock decrement -- */

-- Atomic `stock = stock - qty`, floored at zero, done in one statement so two
-- concurrent checkouts cannot both read the same stock and both "win" (the
-- lost-update race a read-then-write from application code would have).
create or replace function decrement_product_stock(p_id uuid, p_qty integer)
returns products
language sql
as $$
  update products
  set stock = greatest(stock - p_qty, 0)
  where id = p_id
  returning *;
$$;

revoke all on function decrement_product_stock(uuid, integer) from public;
revoke all on function decrement_product_stock(uuid, integer) from anon;
revoke all on function decrement_product_stock(uuid, integer) from authenticated;
grant execute on function decrement_product_stock(uuid, integer) to service_role;

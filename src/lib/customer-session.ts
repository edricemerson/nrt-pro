import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomToken, sha256Hex } from "@/lib/crypto-token";

/** httpOnly cookie holding the raw session token. Only its SHA-256 hash is stored. */
export const CUSTOMER_COOKIE_NAME = "nrtpro_customer_session";
// Buyers, unlike admins, shouldn't have to re-authenticate weekly.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Minimal identity used for session plumbing - callers that need the full
 *  delivery profile fetch it separately via getCustomerById(). */
export interface CustomerSessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
}

/** Verifies email/password via the verify_customer_login() RPC (0004 migration). */
export async function verifyCustomerCredentials(
  email: string,
  password: string,
): Promise<CustomerSessionUser | null> {
  const { data, error } = await getSupabaseAdmin().rpc("verify_customer_login", {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id, email: row.email, name: row.name, phone: row.phone } : null;
}

/** Creates a session row and returns the raw token to put in a cookie. */
export async function createCustomerSession(
  customerId: string,
  userAgent: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("customer_sessions").insert({
    customer_id: customerId,
    token_hash: await sha256Hex(token),
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent,
  });
  if (error) throw new Error(error.message);

  // Best-effort housekeeping; a failure here should never block login.
  await supabase.from("customer_sessions").delete().lt("expires_at", new Date().toISOString());

  return { token, expiresAt };
}

/** Looks up the session for a raw cookie token. Null if missing or expired. */
export async function verifyCustomerSession(
  token: string | undefined,
): Promise<CustomerSessionUser | null> {
  if (!token) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("customer_sessions")
    .select("expires_at, customers!inner(id, email, name, phone)")
    .eq("token_hash", await sha256Hex(token))
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  return customer
    ? { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone }
    : null;
}

export async function deleteCustomerSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await getSupabaseAdmin()
    .from("customer_sessions")
    .delete()
    .eq("token_hash", await sha256Hex(token));
}

/**
 * Revokes every session for a customer except the one whose raw token is
 * passed in. Called after a password change so a stolen or shared session
 * cannot outlive the credential it was obtained with - without this, changing
 * your password does nothing to evict an attacker who is already logged in.
 */
export async function deleteOtherCustomerSessions(
  customerId: string,
  keepToken: string | undefined,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("customer_sessions").delete().eq("customer_id", customerId);
  if (keepToken) query = query.neq("token_hash", await sha256Hex(keepToken));
  await query;
}

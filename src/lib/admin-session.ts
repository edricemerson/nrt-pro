import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomToken, sha256Hex } from "@/lib/crypto-token";

/** httpOnly cookie holding the raw session token. Only its SHA-256 hash is stored. */
export const ADMIN_COOKIE_NAME = "nrtpro_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff";
}

/** Verifies email/password via the verify_admin_login() RPC (0003 migration). */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminSessionUser | null> {
  const { data, error } = await getSupabaseAdmin().rpc("verify_admin_login", {
    p_email: email,
    p_password: password,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null;
}

/** Creates a session row and returns the raw token to put in a cookie. */
export async function createAdminSession(
  adminUserId: string,
  userAgent: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("admin_sessions").insert({
    admin_user_id: adminUserId,
    token_hash: await sha256Hex(token),
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent,
  });
  if (error) throw new Error(error.message);

  await supabase
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminUserId);

  // Best-effort housekeeping; a failure here should never block login.
  await supabase.from("admin_sessions").delete().lt("expires_at", new Date().toISOString());

  return { token, expiresAt };
}

/** Looks up the session for a raw cookie token. Null if missing, expired, or the admin is inactive. */
export async function verifyAdminSession(
  token: string | undefined,
): Promise<AdminSessionUser | null> {
  if (!token) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("admin_sessions")
    .select("expires_at, admin_users!inner(id, email, name, role, active)")
    .eq("token_hash", await sha256Hex(token))
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  const admin = Array.isArray(data.admin_users) ? data.admin_users[0] : data.admin_users;
  if (!admin || !admin.active) return null;

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function deleteAdminSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await getSupabaseAdmin().from("admin_sessions").delete().eq("token_hash", await sha256Hex(token));
}

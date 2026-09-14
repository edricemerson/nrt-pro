import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Customer, DeliveryProfile, RegisterInput } from "@/lib/types";

/**
 * Supabase-backed customer queries. Route Handlers under src/app/api/auth and
 * src/app/api/customers call these.
 *
 * The frontend's `Customer`/`DeliveryProfile` is one flat object, but the real
 * schema (0002 migration) splits it across two tables: `customers` holds the
 * account (email, password, name, phone) and `customer_addresses` holds the
 * delivery details, because a buyer can have more than one address. This app's
 * UI only ever shows one, so every customer gets exactly one `is_default`
 * address row, created at registration - `name`/`phone` are written to both
 * the account and that row so they stay in sync (the schema allows a
 * recipient to differ from the account holder; the current UI does not).
 */

export class DuplicateEmailError extends Error {}

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
}

interface AddressRow {
  id: string;
  label: "rumah" | "kantor" | "lainnya";
  recipient_name: string;
  phone: string;
  alt_phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  courier_note: string;
  lat: number | string | null;
  lng: number | string | null;
}

const CUSTOMER_COLUMNS = "id, email, name, phone, created_at";
const ADDRESS_COLUMNS =
  "id, label, recipient_name, phone, alt_phone, address, province, city, district, postal_code, courier_note, lat, lng";

function combine(customerRow: CustomerRow, addressRow: AddressRow | null): Customer {
  return {
    id: customerRow.id,
    email: customerRow.email,
    createdAt: customerRow.created_at,
    name: customerRow.name,
    phone: customerRow.phone,
    altPhone: addressRow?.alt_phone ?? "",
    addressLabel: addressRow?.label ?? "rumah",
    address: addressRow?.address ?? "",
    province: addressRow?.province ?? "",
    city: addressRow?.city ?? "",
    district: addressRow?.district ?? "",
    postalCode: addressRow?.postal_code ?? "",
    courierNote: addressRow?.courier_note ?? "",
    coords:
      addressRow?.lat != null && addressRow?.lng != null
        ? { lat: Number(addressRow.lat), lng: Number(addressRow.lng) }
        : null,
  };
}

async function getDefaultAddress(customerId: string): Promise<AddressRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("customer_addresses")
    .select(ADDRESS_COLUMNS)
    .eq("customer_id", customerId)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AddressRow | null;
}

/** Hashes a plaintext password via the hash_password() RPC (0004 migration). */
export async function hashPassword(password: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().rpc("hash_password", {
    p_password: password,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data: customerRow, error } = await getSupabaseAdmin()
    .from("customers")
    .select(CUSTOMER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!customerRow) return null;

  const addressRow = await getDefaultAddress(id);
  return combine(customerRow as CustomerRow, addressRow);
}

export async function registerCustomer(input: RegisterInput): Promise<Customer> {
  const supabase = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  const { data: customerRow, error: insertError } = await supabase
    .from("customers")
    .insert({ email, password_hash: passwordHash, name: input.name, phone: input.phone })
    .select(CUSTOMER_COLUMNS)
    .single();
  if (insertError) {
    if (insertError.code === "23505") {
      throw new DuplicateEmailError("Email ini sudah terdaftar. Silakan masuk.");
    }
    throw new Error(insertError.message);
  }

  const { data: addressRow, error: addressError } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customerRow.id,
      label: input.addressLabel,
      recipient_name: input.name,
      phone: input.phone,
      alt_phone: input.altPhone,
      address: input.address,
      province: input.province,
      city: input.city,
      district: input.district,
      postal_code: input.postalCode,
      courier_note: input.courierNote,
      lat: input.coords?.lat ?? null,
      lng: input.coords?.lng ?? null,
      is_default: true,
    })
    .select(ADDRESS_COLUMNS)
    .single();
  if (addressError) throw new Error(addressError.message);

  return combine(customerRow as CustomerRow, addressRow as AddressRow);
}

/** Only includes keys actually present in `patch`, so a partial update never
 *  overwrites the rest of the row with undefined. */
export async function updateDeliveryProfile(
  id: string,
  patch: Partial<DeliveryProfile>,
): Promise<Customer> {
  const supabase = getSupabaseAdmin();

  const customerPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) customerPatch.name = patch.name;
  if (patch.phone !== undefined) customerPatch.phone = patch.phone;
  if (Object.keys(customerPatch).length > 0) {
    const { error } = await supabase.from("customers").update(customerPatch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  const addressPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) addressPatch.recipient_name = patch.name;
  if (patch.phone !== undefined) addressPatch.phone = patch.phone;
  if (patch.altPhone !== undefined) addressPatch.alt_phone = patch.altPhone;
  if (patch.addressLabel !== undefined) addressPatch.label = patch.addressLabel;
  if (patch.address !== undefined) addressPatch.address = patch.address;
  if (patch.province !== undefined) addressPatch.province = patch.province;
  if (patch.city !== undefined) addressPatch.city = patch.city;
  if (patch.district !== undefined) addressPatch.district = patch.district;
  if (patch.postalCode !== undefined) addressPatch.postal_code = patch.postalCode;
  if (patch.courierNote !== undefined) addressPatch.courier_note = patch.courierNote;
  if (patch.coords !== undefined) {
    addressPatch.lat = patch.coords?.lat ?? null;
    addressPatch.lng = patch.coords?.lng ?? null;
  }

  if (Object.keys(addressPatch).length > 0) {
    const existing = await getDefaultAddress(id);
    if (existing) {
      const { error } = await supabase
        .from("customer_addresses")
        .update(addressPatch)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      // Defensive fallback - registration always creates one, so this should
      // not normally run.
      const { error } = await supabase.from("customer_addresses").insert({
        customer_id: id,
        is_default: true,
        label: "rumah",
        recipient_name: "",
        phone: "",
        alt_phone: "",
        address: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        courier_note: "",
        ...addressPatch,
      });
      if (error) throw new Error(error.message);
    }
  }

  const updated = await getCustomerById(id);
  if (!updated) throw new Error("Akun tidak ditemukan.");
  return updated;
}

export async function updatePasswordHash(id: string, passwordHash: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("customers")
    .update({ password_hash: passwordHash })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

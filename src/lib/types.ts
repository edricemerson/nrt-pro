/**
 * Domain types. These mirror the intended PostgreSQL (Supabase) tables so the
 * Golang API can serialise straight into them.
 *
 *   categories(id text pk, name text, description text, sort_order int)
 *   products(id uuid pk, slug text unique, sku text unique, name text, spec text,
 *            type_code text, category_id text fk, price bigint, stock int,
 *            pack_qty int, pack_unit text, description text, images text[],
 *            active bool, created_at timestamptz, updated_at timestamptz)
 *   orders(id uuid pk, order_no text unique, customer_id uuid fk null,
 *          customer_name text, customer_phone text,
 *          customer_address text, status text, shipping_cost bigint,
 *          payment_method text, created_at timestamptz)
 *   order_items(id uuid pk, order_id uuid fk, product_id uuid fk, name_snapshot text,
 *               sku_snapshot text, unit_price bigint, qty int)
 *   customers(id uuid pk, email citext unique, password_hash text, password_salt text,
 *             name text, phone text, alt_phone text, address_label text, address text,
 *             province text, city text, district text, postal_code text,
 *             courier_note text, lat numeric, lng numeric, created_at timestamptz)
 *   settings(id int pk, store_name text, bank_name text, bank_account_no text,
 *            bank_account_name text, payment_fee_percent numeric,
 *            payment_fee_flat bigint, marketplace_fee_percent numeric)
 *
 * Money is always stored as an integer number of rupiah (no decimals).
 */

export type CategoryId =
  | "staples-nail-gun"
  | "bor"
  | "gerinda-poles"
  | "mesin-potong"
  | "hammer-demolition"
  | "cordless"
  | "kerja-kayu"
  | "sander-amplas"
  | "spray-gun"
  | "blower-heat-gun"
  | "peralatan-lain";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  /** Manufacturer type code, used as the stock keeping unit. */
  sku: string;
  name: string;
  /** Short spec line from the price list, e.g. "Paku: F Max:30mm". */
  spec: string;
  typeCode: string;
  categoryId: CategoryId;
  /** Selling price in IDR. */
  price: number;
  stock: number;
  /** Units per carton, from the price list. */
  packQty: number;
  packUnit: "pcs" | "set";
  description: string;
  /** Image URLs or data URLs. First image is the thumbnail. */
  images: string[];
  active: boolean;
}

/** Payload accepted by createProduct / updateProduct. */
export type ProductInput = Omit<Product, "id" | "slug"> & { slug?: string };

export type OrderStatus =
  | "menunggu_pembayaran"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";

export interface OrderItem {
  productId: string;
  /** Copied at order time so later price/name edits do not rewrite history. */
  nameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNo: string;
  /** Set when a signed-in buyer checks out. Null for guest checkout. */
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  items: OrderItem[];
  /** Ongkos kirim charged to the customer. */
  shippingCost: number;
  paymentMethod: "transfer_bank" | "qris" | "cod";
  createdAt: string;
}

export interface Settings {
  storeName: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  /** Percentage cut by the payment gateway, e.g. 2.9 */
  paymentFeePercent: number;
  /** Flat fee per transaction in IDR. */
  paymentFeeFlat: number;
  /** Percentage cut by the marketplace / platform. */
  marketplaceFeePercent: number;
}

/** Per-order money breakdown, computed by lib/finance.ts. */
export interface OrderFinance {
  subtotal: number;
  shippingCost: number;
  gross: number;
  paymentFee: number;
  marketplaceFee: number;
  totalFee: number;
  /** What actually lands in the bank account. */
  netToBank: number;
  itemCount: number;
}

export interface CartLine {
  productId: string;
  qty: number;
}

/** Where a courier should drop the package. Kept separate from the account so a
 *  signed-in buyer can edit delivery details without touching credentials. */
export interface DeliveryProfile {
  name: string;
  /** Primary WhatsApp number - the one the courier actually calls. */
  phone: string;
  /** Optional backup number, e.g. a satpam or family member. */
  altPhone: string;
  addressLabel: "rumah" | "kantor" | "lainnya";
  /** Street, house number, RT/RW. */
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  /** Landmark or instruction, e.g. "pagar hijau, seberang masjid, titip satpam". */
  courierNote: string;
  /** GPS pin captured from the browser, when the buyer shares it. */
  coords: { lat: number; lng: number } | null;
}

/** A customer account. The password hash never leaves Postgres - see
 *  src/lib/db/customers.ts - so no "stored" variant of this type exists. */
export interface Customer extends DeliveryProfile {
  id: string;
  email: string;
  createdAt: string;
}

/** Payload for registerCustomer. */
export type RegisterInput = DeliveryProfile & {
  email: string;
  password: string;
};

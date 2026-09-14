import type { Order, OrderFinance, Settings } from "@/lib/types";

/** Orders that actually produce money. Cancelled orders are excluded everywhere. */
export const REVENUE_STATUSES = ["diproses", "dikirim", "selesai"] as const;

export function isRevenueOrder(order: Order): boolean {
  return (REVENUE_STATUSES as readonly string[]).includes(order.status);
}

export function orderSubtotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Money breakdown for one order.
 *
 *   gross        = subtotal barang + ongkir yang dibayar pembeli
 *   paymentFee   = gross * paymentFeePercent + paymentFeeFlat
 *   marketplaceFee = subtotal barang * marketplaceFeePercent  (ongkir tidak dipotong)
 *   netToBank    = gross - paymentFee - marketplaceFee
 */
export function computeOrderFinance(order: Order, settings: Settings): OrderFinance {
  const subtotal = orderSubtotal(order);
  const shippingCost = order.shippingCost;
  const gross = subtotal + shippingCost;

  const paymentFee =
    order.paymentMethod === "cod"
      ? 0
      : Math.round((gross * settings.paymentFeePercent) / 100) + settings.paymentFeeFlat;

  const marketplaceFee = Math.round((subtotal * settings.marketplaceFeePercent) / 100);
  const totalFee = paymentFee + marketplaceFee;

  return {
    subtotal,
    shippingCost,
    gross,
    paymentFee,
    marketplaceFee,
    totalFee,
    netToBank: gross - totalFee,
    itemCount: orderItemCount(order),
  };
}

export interface FinanceSummary {
  orderCount: number;
  itemCount: number;
  gross: number;
  totalFee: number;
  netToBank: number;
  /** Orders not yet paid - money that has not arrived. */
  pendingCount: number;
  pendingGross: number;
}

export function summarise(orders: Order[], settings: Settings): FinanceSummary {
  const summary: FinanceSummary = {
    orderCount: 0,
    itemCount: 0,
    gross: 0,
    totalFee: 0,
    netToBank: 0,
    pendingCount: 0,
    pendingGross: 0,
  };

  for (const order of orders) {
    const f = computeOrderFinance(order, settings);
    if (order.status === "dibatalkan") continue;
    if (order.status === "menunggu_pembayaran") {
      summary.pendingCount += 1;
      summary.pendingGross += f.gross;
      continue;
    }
    summary.orderCount += 1;
    summary.itemCount += f.itemCount;
    summary.gross += f.gross;
    summary.totalFee += f.totalFee;
    summary.netToBank += f.netToBank;
  }

  return summary;
}

export interface SoldProductRow {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  revenue: number;
}

/** Barang terjual, diurutkan dari jumlah terbanyak. */
export function soldProducts(orders: Order[]): SoldProductRow[] {
  const rows = new Map<string, SoldProductRow>();

  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;
    for (const item of order.items) {
      const row = rows.get(item.productId) ?? {
        productId: item.productId,
        name: item.nameSnapshot,
        sku: item.skuSnapshot,
        qty: 0,
        revenue: 0,
      };
      row.qty += item.qty;
      row.revenue += item.qty * item.unitPrice;
      rows.set(item.productId, row);
    }
  }

  return [...rows.values()].sort((a, b) => b.qty - a.qty);
}

/** "2026-09" bucket key for an ISO timestamp. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

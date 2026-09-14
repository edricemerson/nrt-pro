"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getOrder, getSettings } from "@/lib/api";
import { computeOrderFinance } from "@/lib/finance";
import { formatDateTime, formatIDR } from "@/lib/format";
import type { Order, Settings } from "@/lib/types";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    Promise.all([getOrder(id), getSettings()]).then(([o, s]) => {
      setOrder(o);
      setSettings(s);
    });
  }, [id]);

  if (!order || !settings) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10" aria-hidden>
        <div className="skeleton h-40" />
        <div className="skeleton mt-6 h-56" />
      </div>
    );
  }

  const finance = computeOrderFinance(order, settings);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up card p-6 text-center">
        <div className="animate-pop mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold">Pesanan berhasil dibuat</h1>
        <p className="mt-1 text-sm text-ink-600">
          Nomor pesanan <strong>{order.orderNo}</strong> &middot;{" "}
          {formatDateTime(order.createdAt)}
        </p>
        {order.paymentMethod === "transfer_bank" && (
          <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
            Silakan transfer <strong>{formatIDR(finance.gross)}</strong> ke{" "}
            {settings.bankName} {settings.bankAccountNo} a.n. {settings.bankAccountName}.
          </p>
        )}
      </div>

      <div className="animate-fade-up card mt-6 overflow-hidden" style={{ animationDelay: "90ms" }}>
        <h2 className="border-b border-ink-200 px-5 py-3 font-semibold">Rincian barang</h2>
        <table className="w-full">
          <thead className="bg-ink-50">
            <tr>
              <th className="th">Barang</th>
              <th className="th text-right">Jumlah</th>
              <th className="th text-right">Harga satuan</th>
              <th className="th text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {order.items.map((item, i) => (
              <tr
                key={item.productId}
                className="stagger animate-fade-up"
                style={{ "--i": i } as React.CSSProperties}
              >
                <td className="td">
                  <span className="font-medium">{item.nameSnapshot}</span>
                  <span className="block text-xs text-ink-500">{item.skuSnapshot}</span>
                </td>
                <td className="td text-right">{item.qty}</td>
                <td className="td text-right">{formatIDR(item.unitPrice)}</td>
                <td className="td text-right font-medium">
                  {formatIDR(item.unitPrice * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-ink-200 bg-ink-50">
            <tr>
              <td className="td text-right text-ink-600" colSpan={3}>
                Subtotal
              </td>
              <td className="td text-right">{formatIDR(finance.subtotal)}</td>
            </tr>
            <tr>
              <td className="td text-right text-ink-600" colSpan={3}>
                Ongkos kirim
              </td>
              <td className="td text-right">{formatIDR(finance.shippingCost)}</td>
            </tr>
            <tr>
              <td className="td text-right font-semibold" colSpan={3}>
                Total bayar
              </td>
              <td className="td text-right text-base font-bold">{formatIDR(finance.gross)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="animate-fade-up mt-6 flex flex-wrap gap-3" style={{ animationDelay: "160ms" }}>
        <Link href="/buy" className="btn-primary">
          Belanja lagi
        </Link>
      </div>
    </div>
  );
}

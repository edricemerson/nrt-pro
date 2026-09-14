"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  getSettings,
  listOrders,
  updateOrderStatus,
  updateSettings,
} from "@/lib/api";
import {
  computeOrderFinance,
  monthKey,
  soldProducts,
  summarise,
} from "@/lib/finance";
import { formatDateTime, formatIDR, formatMonth, formatNumber, parseNumber } from "@/lib/format";
import type { Order, OrderStatus, Settings } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-amber-100 text-amber-800",
  diproses: "bg-sky-100 text-sky-800",
  dikirim: "bg-indigo-100 text-indigo-800",
  selesai: "bg-emerald-100 text-emerald-800",
  dibatalkan: "bg-ink-100 text-ink-500",
};

const PAYMENT_LABEL: Record<Order["paymentMethod"], string> = {
  transfer_bank: "Transfer bank",
  qris: "QRIS",
  cod: "COD",
};

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string>("semua");
  const [status, setStatus] = useState<OrderStatus | "semua">("semua");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listOrders(), getSettings()]).then(([o, s]) => {
      setOrders(o);
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const months = useMemo(
    () => [...new Set(orders.map((o) => monthKey(o.createdAt)))].sort().reverse(),
    [orders],
  );

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (month !== "semua" && monthKey(o.createdAt) !== month) return false;
        if (status !== "semua" && o.status !== status) return false;
        return true;
      }),
    [orders, month, status],
  );

  const summary = useMemo(
    () => (settings ? summarise(filtered, settings) : null),
    [filtered, settings],
  );

  const sold = useMemo(() => soldProducts(filtered), [filtered]);

  async function changeStatus(order: Order, next: OrderStatus) {
    const updated = await updateOrderStatus(order.id, next);
    setOrders((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function saveSettings(patch: Partial<Settings>) {
    const next = await updateSettings(patch);
    setSettings(next);
  }

  if (loading || !settings || !summary) {
    return (
      <div aria-hidden>
        <div className="skeleton h-8 w-48" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
        <div className="skeleton mt-6 h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
          <p className="mt-1 text-sm text-ink-500">
            Pesanan masuk, barang yang dipesan, dan uang bersih yang masuk ke rekening.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-48"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="semua">Semua bulan</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
          <select
            className="input w-52"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "semua")}
          >
            <option value="semua">Semua status</option>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pesanan terbayar" value={formatNumber(summary.orderCount)} delay={0} />
        <StatCard label="Barang terjual" value={`${formatNumber(summary.itemCount)} pcs`} delay={60} />
        <StatCard label="Omzet kotor" value={formatIDR(summary.gross)} delay={120} />
        <StatCard
          label="Biaya (payment + platform)"
          value={`- ${formatIDR(summary.totalFee)}`}
          tone="warn"
          delay={180}
        />
      </div>

      <div className="animate-fade-up mt-3 grid items-start gap-3 lg:grid-cols-[1fr_340px]" style={{ animationDelay: "220ms" }}>
        <div className="card border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
            Total diterima di rekening
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">
            {formatIDR(summary.netToBank)}
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            Masuk ke {settings.bankName} {settings.bankAccountNo} a.n. {settings.bankAccountName}
          </p>
          {summary.pendingCount > 0 && (
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-amber-800">
              {summary.pendingCount} pesanan senilai {formatIDR(summary.pendingGross)} masih
              menunggu pembayaran dan belum dihitung.
            </p>
          )}
        </div>

        <BankSettingsCard settings={settings} onSave={saveSettings} />
      </div>

      <section className="animate-fade-up card mt-6 overflow-hidden" style={{ animationDelay: "260ms" }}>
        <div className="border-b border-ink-200 px-5 py-3">
          <h2 className="font-semibold">Pesanan masuk</h2>
          <p className="text-sm text-ink-500">
            Klik baris untuk melihat barang yang dipesan beserta jumlahnya.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">No. Pesanan</th>
                <th className="th">Pelanggan</th>
                <th className="th text-right">Barang</th>
                <th className="th text-right">Omzet</th>
                <th className="th text-right">Biaya</th>
                <th className="th text-right">Diterima</th>
                <th className="th w-56">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-ink-500" colSpan={7}>
                    Belum ada pesanan pada filter ini.
                  </td>
                </tr>
              )}
              {filtered.map((order, i) => {
                const f = computeOrderFinance(order, settings);
                const open = expanded === order.id;
                const dead = order.status === "dibatalkan";
                return (
                  <Fragment key={order.id}>
                    <tr
                      className="stagger animate-fade-up cursor-pointer hover:bg-ink-50/60"
                      style={{ "--i": i } as React.CSSProperties}
                      onClick={() => setExpanded(open ? null : order.id)}
                    >
                      <td className="td">
                        <span className="font-medium">{order.orderNo}</span>
                        <span className="block text-xs text-ink-500">
                          {formatDateTime(order.createdAt)} &middot;{" "}
                          {PAYMENT_LABEL[order.paymentMethod]}
                        </span>
                      </td>
                      <td className="td">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="block text-xs text-ink-500">{order.customerPhone}</span>
                      </td>
                      <td className="td text-right">{formatNumber(f.itemCount)}</td>
                      <td className="td text-right">{formatIDR(f.gross)}</td>
                      <td className="td text-right text-amber-700">
                        {f.totalFee > 0 ? `- ${formatIDR(f.totalFee)}` : "-"}
                      </td>
                      <td
                        className={`td text-right font-semibold ${
                          dead ? "text-ink-400 line-through" : "text-emerald-700"
                        }`}
                      >
                        {formatIDR(f.netToBank)}
                      </td>
                      <td className="td" onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`badge w-full cursor-pointer appearance-none border-0 bg-[position:right_0.4rem_center] px-2 py-1.5 text-center outline-none transition-colors ${
                            STATUS_STYLE[order.status]
                          }`}
                          value={order.status}
                          onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                        >
                          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-ink-50/70">
                        <td className="px-4 py-4" colSpan={7}>
                          <div className="animate-fade-up grid gap-6 lg:grid-cols-[1fr_320px]">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                                Barang yang dipesan
                              </p>
                              <table className="mt-2 w-full">
                                <thead>
                                  <tr className="text-xs text-ink-500">
                                    <th className="py-1 text-left font-medium">Barang</th>
                                    <th className="py-1 text-right font-medium">Jumlah</th>
                                    <th className="py-1 text-right font-medium">Harga satuan</th>
                                    <th className="py-1 text-right font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr key={item.productId} className="border-t border-ink-200">
                                      <td className="py-2 text-sm">
                                        <span className="font-medium">{item.nameSnapshot}</span>
                                        <span className="block text-xs text-ink-500">
                                          {item.skuSnapshot}
                                        </span>
                                      </td>
                                      <td className="py-2 text-right text-sm font-semibold">
                                        {item.qty}
                                      </td>
                                      <td className="py-2 text-right text-sm">
                                        {formatIDR(item.unitPrice)}
                                      </td>
                                      <td className="py-2 text-right text-sm font-medium">
                                        {formatIDR(item.unitPrice * item.qty)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <p className="mt-3 text-xs text-ink-500">
                                Kirim ke: {order.customerAddress}
                              </p>
                            </div>

                            <div className="card p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                                Rincian uang masuk
                              </p>
                              <dl className="mt-3 space-y-1.5 text-sm">
                                <Row label="Subtotal barang" value={formatIDR(f.subtotal)} />
                                <Row label="Ongkos kirim" value={formatIDR(f.shippingCost)} />
                                <Row label="Total dibayar pembeli" value={formatIDR(f.gross)} bold />
                                <Row
                                  label={`Biaya payment (${settings.paymentFeePercent}% + ${formatIDR(
                                    settings.paymentFeeFlat,
                                  )})`}
                                  value={`- ${formatIDR(f.paymentFee)}`}
                                  tone="warn"
                                />
                                <Row
                                  label={`Biaya platform (${settings.marketplaceFeePercent}%)`}
                                  value={`- ${formatIDR(f.marketplaceFee)}`}
                                  tone="warn"
                                />
                              </dl>
                              <div className="mt-3 flex items-center justify-between border-t border-ink-200 pt-3">
                                <span className="text-sm font-semibold">Masuk ke rekening</span>
                                <span className="text-lg font-bold text-emerald-700">
                                  {formatIDR(f.netToBank)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-3">
          <h2 className="font-semibold">Barang terjual</h2>
          <p className="text-sm text-ink-500">
            Dihitung dari pesanan yang sudah dibayar (diproses, dikirim, selesai).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">Barang</th>
                <th className="th w-32 text-right">Jumlah</th>
                <th className="th w-44 text-right">Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sold.length === 0 && (
                <tr>
                  <td className="td py-8 text-center text-ink-500" colSpan={3}>
                    Belum ada barang terjual pada filter ini.
                  </td>
                </tr>
              )}
              {sold.map((row, i) => (
                <tr key={row.productId} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
                  <td className="td">
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-xs text-ink-500">{row.sku}</span>
                  </td>
                  <td className="td text-right font-semibold">{formatNumber(row.qty)}</td>
                  <td className="td text-right">{formatIDR(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "warn";
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-600">{label}</dt>
      <dd
        className={`shrink-0 ${bold ? "font-semibold" : ""} ${
          tone === "warn" ? "text-amber-700" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  tone?: "warn";
  delay?: number;
}) {
  return (
    <div className="animate-fade-up card p-4" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "warn" ? "text-amber-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function BankSettingsCard({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings), [settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await onSave(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <form onSubmit={save} className="card p-5">
      <h2 className="font-semibold">Rekening &amp; potongan</h2>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="bank">
              Bank
            </label>
            <input
              id="bank"
              className="input"
              value={draft.bankName}
              onChange={(e) => setDraft({ ...draft, bankName: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="rek">
              No. rekening
            </label>
            <input
              id="rek"
              className="input"
              value={draft.bankAccountNo}
              onChange={(e) => setDraft({ ...draft, bankAccountNo: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="an">
            Atas nama
          </label>
          <input
            id="an"
            className="input"
            value={draft.bankAccountName}
            onChange={(e) => setDraft({ ...draft, bankAccountName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="pf">
              Payment %
            </label>
            <input
              id="pf"
              className="input"
              inputMode="decimal"
              value={draft.paymentFeePercent}
              onChange={(e) =>
                setDraft({ ...draft, paymentFeePercent: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="pff">
              Flat (Rp)
            </label>
            <input
              id="pff"
              className="input"
              inputMode="numeric"
              value={formatNumber(draft.paymentFeeFlat)}
              onChange={(e) =>
                setDraft({ ...draft, paymentFeeFlat: parseNumber(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="mf">
              Platform %
            </label>
            <input
              id="mf"
              className="input"
              inputMode="decimal"
              value={draft.marketplaceFeePercent}
              onChange={(e) =>
                setDraft({ ...draft, marketplaceFeePercent: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className={`btn-secondary mt-4 w-full ${saved ? "animate-pop border-emerald-300 bg-emerald-50 text-emerald-800" : ""}`}
      >
        {saved ? "Tersimpan" : "Simpan pengaturan"}
      </button>
    </form>
  );
}

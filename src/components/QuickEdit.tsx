"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber, parseNumber } from "@/lib/format";

/**
 * Inline quick-edit field used for stock and price in the admin product list.
 * Enter saves, Escape cancels, blur saves. `onSave` is awaited so the row can
 * show a saving state while the API call is in flight.
 */
export function QuickEdit({
  value,
  onSave,
  prefix,
  suffix,
  align = "right",
  width = "w-28",
  danger,
}: {
  value: number;
  onSave: (next: number) => Promise<void> | void;
  prefix?: string;
  suffix?: string;
  align?: "left" | "right";
  width?: string;
  /** Highlights the displayed value, e.g. stock at zero. */
  danger?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function start() {
    setDraft(formatNumber(value));
    setEditing(true);
  }

  async function commit() {
    const next = parseNumber(draft);
    setEditing(false);
    if (next === value) return;
    setSaving(true);
    await onSave(next);
    setSaving(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 900);
  }

  if (editing) {
    return (
      <div className={`animate-scale-in flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {prefix && <span className="text-xs text-ink-500">{prefix}</span>}
        <input
          ref={inputRef}
          className={`${width} rounded-md border border-brand-500 px-2 py-1 text-sm outline-none ring-2 ring-brand-100 ${
            align === "right" ? "text-right" : ""
          }`}
          value={draft}
          inputMode="numeric"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
        />
        {suffix && <span className="text-xs text-ink-500">{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={start}
      disabled={saving}
      title="Klik untuk ubah cepat"
      className={`group flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-brand-50 ${
        justSaved ? "bg-emerald-50" : ""
      } ${align === "right" ? "justify-end" : ""}`}
    >
      <span className={danger ? "font-semibold text-red-600" : "font-medium"}>
        {saving ? (
          <span className="animate-pulse">...</span>
        ) : (
          `${prefix ?? ""}${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`
        )}
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-3.5 w-3.5 shrink-0 text-ink-300 transition-colors group-hover:text-brand-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
        />
      </svg>
    </button>
  );
}

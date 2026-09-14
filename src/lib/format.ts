const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("id-ID");

export function formatIDR(value: number): string {
  return RUPIAH.format(Math.round(value));
}

/** "1.250.000" - for input fields and compact tables. */
export function formatNumber(value: number): string {
  return NUMBER.format(Math.round(value));
}

/** Parses "1.250.000" or "1250000" back into 1250000. */
export function parseNumber(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-09" -> "September 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

export function slugify(...bits: string[]): string {
  return (
    bits
      .filter(Boolean)
      .join(" ")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "produk"
  );
}

import { NrtProLogo, YamamaxProLogo } from "@/components/BrandLogos";

/** Slim red announcement bar that sits directly under the site header. */
export function DistributorStrip() {
  return (
    <div className="brand-plate text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest sm:text-[13px]">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
          <path
            fillRule="evenodd"
            d="M12 1.5l7.5 3v6c0 5.02-3.2 9.4-7.5 10.99C7.7 19.9 4.5 15.52 4.5 10.5v-6l7.5-3zm3.86 7.4a.9.9 0 10-1.32-1.22l-3.6 3.9-1.5-1.5A.9.9 0 108.17 11.4l2.16 2.16a.9.9 0 001.31-.03l4.22-4.63z"
            clipRule="evenodd"
          />
        </svg>
        Distributor Resmi NRT-PRO &amp; YAMAMAX PRO
      </div>
    </div>
  );
}

/**
 * Full statement panel with both marks. Used on the catalog page and in the
 * footer, so it takes a `tone` for the light and dark surfaces it lands on.
 */
export function DistributorPanel({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  return (
    <section
      className={
        dark
          ? "rounded-2xl border border-white/15 bg-white/5 p-6"
          : "card border-ink-200 p-6 shadow-sm"
      }
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${
              dark ? "text-brand-300" : "text-brand-600"
            }`}
          >
            Distributor Resmi
          </p>
          <h2
            className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${
              dark ? "text-white" : "text-ink-900"
            }`}
          >
            Kami distributor resmi NRT-PRO &amp; YAMAMAX PRO
          </h2>
          <p className={`mt-2 max-w-xl text-sm ${dark ? "text-ink-300" : "text-ink-600"}`}>
            Seluruh unit dikirim langsung dari gudang resmi, bersegel pabrik, dan
            bergaransi. Bukan barang refurbish atau paralel.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-ink-200">
            <NrtProLogo className="h-11 w-auto" />
          </div>
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-ink-200">
            <YamamaxProLogo className="h-11 w-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

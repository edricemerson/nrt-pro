import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { DistributorStrip } from "@/components/OfficialDistributor";
import { NrtProLogo, YamamaxProLogo } from "@/components/BrandLogos";
import { PageTransition } from "@/components/PageTransition";

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <DistributorStrip />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <footer className="mt-16 border-t-4 border-brand-600 bg-ink-900 text-ink-300">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
                Distributor Resmi
              </p>
              <p className="mt-2 max-w-md text-sm">
                Kami adalah distributor resmi{" "}
                <span className="whitespace-nowrap font-semibold text-white">
                  NRT-PRO Power Tools
                </span>{" "}
                dan{" "}
                <span className="whitespace-nowrap font-semibold text-white">
                  YAMAMAX PRO
                </span>
                .
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-1.5">
                <NrtProLogo className="h-9 w-auto" />
              </div>
              <div className="rounded-lg bg-white p-1.5">
                <YamamaxProLogo className="h-8 w-auto" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} MajuSuksesTeknik. Harga sewaktu-waktu
              dapat berubah.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

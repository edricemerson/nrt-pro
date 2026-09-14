import Link from "next/link";
import { DistributorPanel } from "@/components/OfficialDistributor";
import { EventsHeroSection } from "@/components/EventsHero";
import { LocationsSection, TeamSection } from "@/components/HomeSections";
import { Reveal } from "@/components/Reveal";

export default function ShopPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b-4 border-brand-600 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 text-white">
        {/* Red diagonal flash, echoing the angular accent in the YAMAMAX PRO mark. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-full w-96 skew-x-[-14deg] bg-brand-600/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-4 top-0 h-full w-40 skew-x-[-14deg] bg-brand-600/30"
        />

        {/* Hero copy fans in on load: eyebrow, headline, then the call to
            action, each a beat behind the last. */}
        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <span className="animate-fade-up inline-flex items-center rounded-full border border-brand-400/40 bg-brand-600/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
            Distributor Resmi
          </span>
          <h1
            className="animate-fade-up mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ animationDelay: "90ms" }}
          >
            Power Tools and Power Machinery{" "}
            <span className="whitespace-nowrap text-brand-400">NRT-PRO</span> dan{" "}
            <span className="whitespace-nowrap text-brand-400">YAMAMAX PRO</span>
          </h1>
          <Link
            href="/buy"
            className="btn-primary animate-fade-up mt-6 inline-flex w-fit hover:shadow-lg hover:shadow-brand-600/25"
            style={{ animationDelay: "180ms" }}
          >
            Belanja Sekarang
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <DistributorPanel />
        </Reveal>
      </div>

      <EventsHeroSection />
      <LocationsSection />
      <TeamSection />
    </>
  );
}

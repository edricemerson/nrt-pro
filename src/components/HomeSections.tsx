import { LOCATIONS, TEAM } from "@/data/company";
import { Reveal } from "@/components/Reveal";

/** Shared heading block so every home section lines up the same way. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          dark ? "text-brand-300" : "text-brand-600"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${
          dark ? "text-white" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      {lead && <p className={`mt-3 ${dark ? "text-ink-300" : "text-ink-600"}`}>{lead}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ locations --- */

export function LocationsSection() {
  return (
    <section id="lokasi" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <Reveal>
        <SectionHeading
          eyebrow="Lokasi"
          title="Cabang dan gudang kami"
          lead="Datang langsung untuk melihat unit, atau hubungi cabang terdekat untuk pengiriman."
        />
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LOCATIONS.map((loc, i) => (
          <Reveal key={loc.id} index={i} className="h-full">
            <article className="card hover-lift flex h-full flex-col p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {loc.role}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight">{loc.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">{loc.address}</p>
              <dl className="mt-4 space-y-1.5 border-t border-ink-200 pt-4 text-sm">
                <div className="flex gap-2">
                  <dt className="text-ink-500">Telepon</dt>
                  <dd className="ml-auto font-medium text-ink-800">{loc.phone}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-500">Jam buka</dt>
                  <dd className="ml-auto text-right text-ink-700">{loc.hours}</dd>
                </div>
              </dl>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- team --- */

export function TeamSection() {
  return (
    <section id="tim" className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <Reveal>
          <SectionHeading
            eyebrow="Tim Kami"
            title="Orang di balik gudang dan meja servis"
            lead="Tim yang menangani pemilihan alat, pengiriman, dan garansi Anda."
          />
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m, i) => (
            <Reveal key={m.id} index={i} className="h-full">
              <article className="card hover-lift flex h-full gap-4 p-5">
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white"
                >
                  {m.initials}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">{m.name}</h3>
                  <p className="text-sm font-medium text-brand-700">{m.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{m.bio}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

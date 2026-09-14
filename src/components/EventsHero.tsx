"use client";

import { useEffect, useState } from "react";
import { EVENTS } from "@/data/company";
import { SectionHeading } from "@/components/HomeSections";
import { Reveal } from "@/components/Reveal";

const AUTOPLAY_MS = 6000;

/**
 * Hero-style carousel for "what's happening at the company". Each slide is a
 * dark banner (same palette as the top hero) with a big icon on one side and
 * the event copy on the other. No photo assets ship with the project, so the
 * "image" is an inline icon plate rather than a hotlinked or placeholder photo.
 */
export function EventsHeroSection() {
  const count = EVENTS.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
  }

  const event = EVENTS[index];

  return (
    <section id="kabar" className="border-y border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <Reveal>
          <SectionHeading
            eyebrow="Kabar Terbaru"
            title="Yang sedang terjadi di perusahaan"
            lead="Kedatangan stok, pelatihan teknisi, dan perubahan layanan cabang."
          />
        </Reveal>

        <Reveal
          className="relative mt-8 overflow-hidden rounded-2xl border-b-4 border-brand-600 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 text-white"
          index={1}
        >
          <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 top-0 h-full w-96 skew-x-[-14deg] bg-brand-600/20"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 top-0 h-full w-40 skew-x-[-14deg] bg-brand-600/30"
            />

            {/* Keying on the event id restarts the crossfade every time the
                slide changes, whether from autoplay or a manual click. */}
            <div
              key={event.id}
              className="animate-fade-in relative grid min-h-[340px] gap-8 px-6 py-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-10"
              aria-live="polite"
            >
              <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 sm:mx-0 sm:h-36 sm:w-36">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  aria-hidden
                  className="h-14 w-14 text-brand-300 sm:h-16 sm:w-16"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={event.icon} />
                </svg>
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <span className="inline-flex items-center rounded-full border border-brand-400/40 bg-brand-600/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
                  {event.tag}
                </span>
                <time dateTime={event.iso} className="mt-3 block text-sm text-ink-400">
                  {event.date}
                </time>
                <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                  {event.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
                  {event.body}
                </p>
              </div>
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Kabar sebelumnya"
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Kabar berikutnya"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <div className="relative flex justify-center gap-2 pb-5">
                  {EVENTS.map((ev, i) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Ke kabar ${i + 1}`}
                      aria-current={i === index}
                      className={`h-2 rounded-full transition-all ${
                        i === index ? "w-6 bg-brand-400" : "w-2 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

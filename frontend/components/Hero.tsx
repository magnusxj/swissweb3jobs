"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const LOCATION_PILLS = [
  { label: "Zug", href: "/?ort=zug" },
  { label: "Zürich", href: "/?ort=zuerich" },
  { label: "Geneva", href: "/?ort=geneva" },
  { label: "Remote CH", href: "/?ort=remote" },
];

const PARTNERS = [
  { name: "Sygnum", mark: "SY" },
  { name: "AMINA", mark: "AM" },
  { name: "Bitcoin Suisse", mark: "BS" },
  { name: "Taurus", mark: "TA" },
  { name: "YouHodler", mark: "YH" },
  { name: "Cardano", mark: "CA" },
];

/**
 * Fullscreen-Hero der Startseite: dunkler Slate-Look mit feinem Raster,
 * zentrierter Suche und Social Proof. Die Suche fokussiert per ⌘K/Ctrl+K.
 */
export function Hero({
  jobCount,
  teamCount,
}: {
  jobCount: number;
  teamCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const jobLabel =
    jobCount >= 10 ? `${Math.floor(jobCount / 10) * 10}+` : `${jobCount}`;

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.16),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(148,163,184,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.11)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_88%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-5xl flex-col px-4 pt-14 pb-0 sm:pt-20 lg:min-h-[calc(100dvh-69px)]">
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 sm:text-[11px]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
            The Premier Crypto Valley Job Board · Zug &amp; Zurich
          </p>

          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Find your next role in Swiss Crypto &amp; Web3.
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Curated opportunities across FINMA-regulated digital asset banks,
            foundations, and tier-1 protocols in Switzerland.
          </p>

          <form
            action="/"
            method="get"
            className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur sm:flex-row sm:items-center"
          >
            <div className="relative flex min-w-0 flex-1 items-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <label htmlFor="hero-search" className="sr-only">
                Search jobs
              </label>
              <input
                ref={inputRef}
                id="hero-search"
                type="search"
                name="q"
                placeholder="Role, company or keyword..."
                autoComplete="off"
                className="h-12 w-full min-w-0 bg-transparent pr-16 pl-10 text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-3 hidden rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
                ⌘K
              </kbd>
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex w-full max-w-2xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="pr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Popular
              </span>
              {LOCATION_PILLS.map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            <a
              href="#jobs"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Browse {jobLabel} Jobs
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <li className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
              {jobLabel} Verified CH Roles
            </li>
            <li className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
              {teamCount} Regulated Teams
            </li>
            <li className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
              100% Swiss Focus
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 pt-5 pb-6 sm:pt-6 sm:pb-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px]">
            Trusted roles from leading Swiss teams
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/10 bg-white/[0.05] text-[9px] font-semibold tracking-wide text-slate-400"
                >
                  {partner.mark}
                </span>
                <span className="text-[13px] font-medium tracking-tight text-slate-400 sm:text-sm">
                  {partner.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

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
  { name: "Sygnum", logo: (props: any) => <svg viewBox="0 0 100 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">SYGNUM</text></svg> },
  { name: "AMINA", logo: (props: any) => <svg viewBox="0 0 85 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">AMINA</text></svg> },
  { name: "Bitcoin Suisse", logo: (props: any) => <svg viewBox="0 0 135 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">Bitcoin Suisse</text></svg> },
  { name: "Taurus", logo: (props: any) => <svg viewBox="0 0 90 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">TAURUS</text></svg> },
  { name: "YouHodler", logo: (props: any) => <svg viewBox="0 0 105 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">YouHodler</text></svg> },
  { name: "Cardano", logo: (props: any) => <svg viewBox="0 0 95 24" {...props}><text x="0" y="18" fontSize="18" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">Cardano</text></svg> },
];

/**
 * Fullscreen-Hero der Startseite: bewusst flächig und ohne Muster.
 * Die Suche fokussiert per ⌘K/Ctrl+K.
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
    <section className="relative border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl flex-col px-4 pt-14 pb-0 sm:pt-20 lg:min-h-[calc(100dvh-69px)]">
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-[11px]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            The Premier Crypto Valley Job Board · Zug &amp; Zurich
          </p>

          <h1 className="mt-6 max-w-3xl text-balance text-2xl font-bold leading-[1.02] tracking-[-0.04em] text-slate-900 md:text-6xl md:font-semibold lg:text-7xl">
            Find your next role in Swiss Crypto &amp; Web3.
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 hidden md:block">
            Curated opportunities across FINMA-regulated digital asset banks,
            foundations, and tier-1 protocols in Switzerland.
          </p>

          <form
            action="/"
            method="get"
            className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:flex-row sm:items-center"
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
                className="h-12 w-full min-w-0 bg-transparent pr-16 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-3 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:block">
                ⌘K
              </kbd>
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Search
            </button>
          </form>

          <div className="mt-4 w-full max-w-2xl flex-col items-center justify-between gap-3 md:flex-row hidden md:flex">
            <div className="flex flex-wrap items-center justify-center gap-1.5 hidden md:flex">
              <span className="pr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Popular
              </span>
              {LOCATION_PILLS.map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            <a
              href="#jobs"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Browse {jobLabel} Jobs
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
              </svg>
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2 hidden md:flex">
            <li className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
              {jobLabel} Verified CH Roles
            </li>
            <li className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              {teamCount} Regulated Teams
            </li>
            <li className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              100% Swiss Focus
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-200 pt-5 pb-6 sm:pt-6 sm:pb-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
            Trusted roles from leading Swiss teams
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex items-center">
                <partner.logo aria-label={partner.name} className="h-6 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity text-slate-500" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

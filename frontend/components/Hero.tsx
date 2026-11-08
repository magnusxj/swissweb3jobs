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
    <section className="relative border-b border-[#1c1836] bg-[#1c1836] text-white">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl flex-col px-4 pt-14 pb-0 sm:pt-20 lg:min-h-[calc(100dvh-69px)]">
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-14">
          

          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
            Find your next role in Swiss Crypto &amp; Web3.
          </h1>

          <p className="mt-3 max-w-xl mx-auto text-pretty text-base leading-6 text-slate-300 md:text-lg hidden md:block">
            Curated opportunities across FINMA-regulated digital asset banks,
            foundations, and protocols.
          </p>

          <form
            action="/"
            method="get"
            className="mt-8 mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full border border-slate-200 bg-white p-2 pl-6 shadow-2xl"
          >
            <div className="relative flex min-w-0 flex-1 items-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-0 h-[18px] w-[18px] text-slate-400"
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
                className="h-12 w-full min-w-0 bg-transparent pr-16 pl-8 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-3 hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
                ⌘K
              </kbd>
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#ea580c] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#d94e08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c]"
            >
              Search
            </button>
          </form>

          

          
        </div>

        <div className="pt-10 pb-6 sm:pt-14 sm:pb-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px]">
            Trusted roles from leading Swiss teams
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
            {PARTNERS.map((partner) => (
              <li key={partner.name} className="flex items-center">
                <partner.logo aria-label={partner.name} className="h-5 sm:h-6 w-auto grayscale opacity-60 hover:opacity-100 transition-opacity duration-200 text-slate-500" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

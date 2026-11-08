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
  { name: "Sygnum", logo: (props: any) => <svg viewBox="0 0 100 24" {...props}><path d="M10 4L2 12L10 20L18 12L10 4Z" fill="currentColor"/><text x="25" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">SYGNUM</text></svg> },
  { name: "AMINA", logo: (props: any) => <svg viewBox="0 0 95 24" {...props}><path d="M4 20L12 4L20 20H16L12 12L8 20H4Z" fill="currentColor"/><text x="25" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">AMINA</text></svg> },
  { name: "Bitcoin Suisse", logo: (props: any) => <svg viewBox="0 0 145 24" {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/><text x="28" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">Bitcoin Suisse</text></svg> },
  { name: "Taurus", logo: (props: any) => <svg viewBox="0 0 100 24" {...props}><path d="M12 2L2 22h20L12 2zm0 6l5 10H7l5-10z" fill="currentColor"/><text x="26" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">TAURUS</text></svg> },
  { name: "YouHodler", logo: (props: any) => <svg viewBox="0 0 120 24" {...props}><path d="M4 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8zm2 0c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6-6 2.69-6 6z" fill="currentColor"/><text x="28" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">YouHodler</text></svg> },
  { name: "Cardano", logo: (props: any) => <svg viewBox="0 0 105 24" {...props}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="currentColor"/><text x="26" y="17" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">Cardano</text></svg> },
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
    <>
    <section className="relative overflow-hidden bg-[#231b42] text-white">
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[220px] pointer-events-none z-0"
        viewBox="0 0 1440 220"
        fill="none"
        preserveAspectRatio="none"
      >
        <circle cx="850" cy="240" r="140" fill="#e04f38" />
        <polygon points="1030,220 1130,35 1270,65 1270,220" fill="#e04f38" />
        <polygon points="1390,220 1440,120 1440,220" fill="#e04f38" />
      </svg>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pt-12 pb-20">
        <div className="flex flex-col items-center justify-center pt-8 pb-10 text-center">
          

          <h1 className="mt-6 max-w-3xl text-balance text-5xl font-extrabold tracking-tight text-white leading-none md:text-7xl">
            Find your role in Swiss Web3!
          </h1>

          <p className="mt-4 max-w-xl mx-auto text-pretty text-base leading-6 text-white/90 font-normal md:text-lg hidden md:block">
            Curated roles at FINMA-regulated digital asset banks, foundations, and protocols in Switzerland.
          </p>

          <form
            action="/"
            method="get"
            className="mt-10 mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full bg-white h-14 md:h-16 px-6 shadow-lg"
          >
            <div className="relative flex min-w-0 flex-1 items-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-0 h-5 w-5 text-slate-700"
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
                className="h-12 w-full min-w-0 bg-transparent pl-8 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#ea580c] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#d94e08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c]"
            >
              Search
            </button>
          </form>

          

          
        </div>

        </div>
    </section>
    
    <div className="bg-white pt-6 pb-6 sm:pt-8 sm:pb-8 border-b border-slate-200">
      <div className="mx-auto w-full max-w-5xl px-4">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
          Trusted roles from leading Swiss teams
        </p>
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
          {PARTNERS.map((partner) => (
            <li key={partner.name} className="flex items-center">
              <partner.logo aria-label={partner.name} className="h-5 sm:h-6 w-auto text-slate-700 opacity-80 hover:opacity-100 transition-opacity duration-200" />
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
  );
}

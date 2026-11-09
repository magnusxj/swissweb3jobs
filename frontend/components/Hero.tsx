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
  { name: "Sygnum", img: "/logos/sygnum.png" },
  { name: "AMINA", img: "/logos/amina.png" },
  { name: "Bitcoin Suisse", img: "/logos/bitcoinsuisse.png" },
  { name: "Taurus", img: "/logos/taurus.png" },
  { name: "YouHodler", img: "/logos/youhodler.png" },
  { name: "Cardano", img: "/logos/cardano.png" },
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
        preserveAspectRatio="xMidYMax slice"
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
            <li key={partner.name} className="flex items-center gap-2">
              <img src={partner.img} alt="" className="h-6 w-6 rounded-sm object-contain grayscale opacity-80" />
              <span className="text-[13px] font-medium tracking-tight text-slate-700 sm:text-sm">{partner.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
  );
}

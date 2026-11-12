const PARTNERS = [
  { name: "Sygnum", mark: "SY" },
  { name: "Bitcoin Suisse", mark: "BS" },
  { name: "AMINA", mark: "AM" },
  { name: "Web3 Foundation", mark: "W3" },
];

/**
 * Trust-Banner unter der Suche. Bewusst in Graustufen gehalten: Monogramm +
 * Wortmarke statt fremder Logo-Assets, damit nichts nach Badge-Sammlung aussieht.
 */
export function TrustStrip() {
  return (
    <section aria-labelledby="trust-heading" className="mt-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-xs sm:py-4">
        <h2
          id="trust-heading"
          className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]"
        >
          Roles at leading teams like
        </h2>
        <ul className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 sm:gap-x-8">
          {PARTNERS.map((partner) => (
            <li key={partner.name} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[9px] font-semibold tracking-wide text-slate-500 grayscale"
              >
                {partner.mark}
              </span>
              <span className="text-[13px] font-medium tracking-tight text-slate-500 grayscale sm:text-sm">
                {partner.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

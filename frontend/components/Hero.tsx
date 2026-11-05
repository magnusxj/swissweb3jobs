/**
 * Hero der Startseite: institutelle B2B-Ansprache mit dezenter visueller
 * Tiefe (feines Raster + weicher Slate-Verlauf), ohne Neon oder Kitsch.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#eff6ff_0%,transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
      />

      <div className="relative px-5 py-8 sm:px-8 sm:py-11">
        <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          Crypto Valley · Schweiz
        </p>

        <h1 className="mt-3 max-w-2xl text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-slate-900 sm:text-4xl lg:text-[2.6rem]">
          Jobs im Crypto Valley Schweiz
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
          Die kuratierte Plattform für regulierte Krypto-Banken, Stiftungen und
          Web3-Infrastruktur-Teams in Zug &amp; Zürich.
        </p>
      </div>
    </section>
  );
}

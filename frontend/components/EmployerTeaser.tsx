import Link from "next/link";

/** B2B-Teaser vor dem Footer: klar getrennt vom Job-Feed, ohne Ablenkung. */
export function EmployerTeaser() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              For employers
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Hiring Swiss Web3 Talent?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Reach specialized blockchain engineers, compliance officers, and
              executives in Switzerland. Fast, transparent, direct.
            </p>
          </div>

          <Link
            href="/post-a-job"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Post a Job for 99 CHF
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

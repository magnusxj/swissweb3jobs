import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PostJobForm } from "@/components/PostJobForm";

export const metadata: Metadata = {
  title: "Job inserieren – Featured Listing (99 CHF)",
  description:
    "Featured Job-Listing im Crypto Valley: 30 Tage aktiv, Sticky Top-Platzierung und Trust-Banner auf Swiss Web3 Jobs. 99 CHF Einmalzahlung.",
  alternates: { canonical: "/post-a-job" },
};

const BENEFITS = [
  "30 Tage aktiv",
  "Sticky Top-Platzierung",
  "Trust-Banner",
  "Featured-Badge",
  "Manuelle Qualitätsprüfung",
];

export default function PostJobPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <span aria-hidden="true">←</span>
            Alle Jobs
          </Link>
          <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            Swiss Web3 Jobs
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px]">
          Job-Inserat · Crypto Valley
        </p>
        <h1 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Inseriere deine Rolle bei Swiss Web3 Jobs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Erreiche regulierte Krypto-Banken, Stiftungen und Web3-Teams in Zug,
          Zürich und der übrigen Schweiz. Ein Inserat, 99 CHF, keine Abos.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="order-2 lg:order-1">
            <PostJobForm />
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Featured Listing
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  Featured Job-Listing im Crypto Valley
                </h2>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    99 CHF
                  </span>
                  <span className="text-sm text-slate-500">Einmalzahlung</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  99 CHF Einmalzahlung (30 Tage aktiv, Sticky Top-Platzierung,
                  Trust-Banner)
                </p>

                <ul className="mt-5 space-y-2.5">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-slate-700">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
                  <span className="font-medium text-slate-700">Total</span>
                  <span className="font-semibold text-slate-900">99.00 CHF</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Zahlung über Stripe, Rechnung in CHF. Nach Zahlungseingang
                  prüfen wir das Inserat und schalten es frei.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

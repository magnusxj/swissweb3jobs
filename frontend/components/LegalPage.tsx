import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";

/** Gemeinsames Gerüst für Impressum und Datenschutzerklärung. */
export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-2.5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Zurück zu den Jobs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Swiss Web3 Jobs
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

        <article className="mt-8 max-w-prose space-y-8 text-sm leading-6 text-slate-600">
          {children}
        </article>
      </main>

      <Footer width="3xl" />
    </div>
  );
}

/** Abschnitt mit Überschrift – einheitlicher Abstand und Stil. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

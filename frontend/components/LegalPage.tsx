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
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto w-full max-w-3xl px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <span aria-hidden="true">←</span>
            Zurück zu den Jobs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Swiss Web3 Jobs
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>

        <article className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-400">
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
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

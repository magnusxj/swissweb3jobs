import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { IS_FREE_BETA } from "@/lib/config";

export const metadata: Metadata = {
  title: "Inserat eingereicht – Swiss Web3 Jobs",
  description: "Bestätigung für dein Job-Inserat auf Swiss Web3 Jobs.",
  robots: { index: false, follow: false },
};

export default function PostJobSuccessPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-600/20 bg-blue-50 text-blue-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {IS_FREE_BETA
              ? "Submission received – we will review and publish your listing shortly."
              : "Vielen Dank! Dein Inserat wurde erfolgreich eingereicht und geht nach Prüfung sofort online."}
          </h1>

          <p className="mt-3 max-w-prose text-sm leading-6 text-slate-600">
            {IS_FREE_BETA
              ? "No payment is required during our launch beta. We manually review the content and then publish the featured listing for 30 days. You will receive a confirmation at the billing email you provided."
              : "Die Zahlung ist eingegangen. Wir prüfen den Inhalt manuell und schalten das Featured-Listing anschliessend für 30 Tage auf. Die Rechnung und Zahlungsbestätigung erhältst du per E-Mail."}
          </p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Was passiert als Nächstes?
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>1. Wir prüfen Titel, Beschreibung und Bewerbungslink.</li>
              <li>2. Das Inserat erscheint als Featured-Job zuoberst im Feed.</li>
              <li>
                3.{" "}
                {IS_FREE_BETA
                  ? "Bei Rückfragen melden wir uns an der angegebenen Rechnungs-E-Mail."
                  : "Bei Rückfragen melden wir uns an der Rechnungs-E-Mail."}
              </li>
            </ul>
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Zum Job-Feed
            </Link>
            <Link
              href="/post-a-job"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Weiteres Inserat aufgeben
            </Link>
          </div>
        </div>
      </main>

      <Footer width="3xl" />
    </div>
  );
}

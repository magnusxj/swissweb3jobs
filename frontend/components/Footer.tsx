import Link from "next/link";

const LINK =
  "inline-flex min-h-11 items-center transition-colors hover:text-slate-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

/**
 * Einheitlicher Footer für Startseite, Detailseiten und Rechtstexte.
 * `note` ergänzt einen kurzen Hinweis, `width` richtet sich nach dem Seitenraster.
 */
export function Footer({
  note,
  width = "5xl",
}: {
  note?: string;
  width?: "3xl" | "5xl";
}) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div
        className={`mx-auto flex w-full ${
          width === "3xl" ? "max-w-3xl" : "max-w-5xl"
        } flex-col gap-1 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>© 2026 Swiss Web3 Jobs. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4">
          {note && <span>{note}</span>}
          <Link href="/impressum" className={LINK}>
            Imprint
          </Link>
          <Link href="/datenschutz" className={LINK}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

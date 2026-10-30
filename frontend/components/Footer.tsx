import Link from "next/link";

const LINK =
  "transition-colors hover:text-zinc-300 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

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
    <footer className="border-t border-zinc-800/80">
      <div
        className={`mx-auto flex w-full ${
          width === "3xl" ? "max-w-3xl" : "max-w-5xl"
        } flex-col gap-2 px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>© 2026 Swiss Web3 Jobs. Alle Rechte vorbehalten.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {note && <span>{note}</span>}
          <Link href="/impressum" className={LINK}>
            Impressum
          </Link>
          <Link href="/datenschutz" className={LINK}>
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}

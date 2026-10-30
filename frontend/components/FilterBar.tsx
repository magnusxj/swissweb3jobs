import Link from "next/link";
import type { JobFilters, LocationFilter, WorkplaceFilter } from "@/lib/jobs";

const ORT_OPTIONS: { value: LocationFilter; label: string }[] = [
  { value: "zuerich", label: "Zürich" },
  { value: "zug", label: "Zug" },
  { value: "remote", label: "Remote CH" },
];

const WORKPLACE_OPTIONS: WorkplaceFilter[] = ["Remote", "Hybrid", "On-site"];

const CHIP =
  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const CHIP_ON = "border-emerald-500/60 bg-emerald-500/15 text-emerald-300";
const CHIP_OFF =
  "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200";

function hrefFor(filters: JobFilters, patch: Partial<JobFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.ort) params.set("ort", next.ort);
  if (next.workplace) params.set("workplace", next.workplace);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function FilterBar({ filters }: { filters: JobFilters }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <form action="/" method="get" className="flex gap-2">
        {filters.ort && <input type="hidden" name="ort" value={filters.ort} />}
        {filters.workplace && (
          <input type="hidden" name="workplace" value={filters.workplace} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Rolle, Firma oder Stack – z.B. Solidity"
          aria-label="Jobs durchsuchen"
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Suchen
        </button>
      </form>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-wide text-zinc-600">
            Ort
          </span>
          <Link
            href={hrefFor(filters, { ort: null })}
            aria-current={!filters.ort ? "true" : undefined}
            className={`${CHIP} ${!filters.ort ? CHIP_ON : CHIP_OFF}`}
          >
            Alle
          </Link>
          {ORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={hrefFor(filters, {
                ort: filters.ort === option.value ? null : option.value,
              })}
              aria-current={
                filters.ort === option.value ? "true" : undefined
              }
              className={`${CHIP} ${
                filters.ort === option.value ? CHIP_ON : CHIP_OFF
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-wide text-zinc-600">
            Modell
          </span>
          <Link
            href={hrefFor(filters, { workplace: null })}
            aria-current={!filters.workplace ? "true" : undefined}
            className={`${CHIP} ${!filters.workplace ? CHIP_ON : CHIP_OFF}`}
          >
            Alle
          </Link>
          {WORKPLACE_OPTIONS.map((option) => (
            <Link
              key={option}
              href={hrefFor(filters, {
                workplace: filters.workplace === option ? null : option,
              })}
              aria-current={filters.workplace === option ? "true" : undefined}
              className={`${CHIP} ${
                filters.workplace === option ? CHIP_ON : CHIP_OFF
              }`}
            >
              {option}
            </Link>
          ))}
        </div>

        {(filters.q || filters.ort || filters.workplace) && (
          <Link
            href="/"
            className="inline-block text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            Filter zurücksetzen
          </Link>
        )}
      </div>
    </div>
  );
}

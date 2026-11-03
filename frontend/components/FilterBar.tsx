import Link from "next/link";
import type { JobFilters, LocationFilter, WorkplaceFilter } from "@/lib/jobs";

const ORT_OPTIONS: { value: LocationFilter; label: string }[] = [
  { value: "zuerich", label: "Zürich" },
  { value: "zug", label: "Zug" },
  { value: "remote", label: "Remote CH" },
];

const WORKPLACE_OPTIONS: WorkplaceFilter[] = ["Remote", "Hybrid", "On-site"];

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center rounded-md border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
const CHIP_ON = "border-slate-900 bg-slate-900 text-white";
const CHIP_OFF =
  "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900";

function hrefFor(filters: JobFilters, patch: Partial<JobFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.ort) params.set("ort", next.ort);
  if (next.workplace) params.set("workplace", next.workplace);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 sm:flex-wrap sm:overflow-visible">
        {children}
      </div>
    </div>
  );
}

export function FilterBar({ filters }: { filters: JobFilters }) {
  const active = Boolean(filters.q || filters.ort || filters.workplace);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
      <form action="/" method="get" className="flex gap-2">
        {filters.ort && <input type="hidden" name="ort" value={filters.ort} />}
        {filters.workplace && (
          <input type="hidden" name="workplace" value={filters.workplace} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Rolle, Firma oder Stack – z. B. Solidity"
          aria-label="Jobs durchsuchen"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Suchen
        </button>
      </form>

      <div className="mt-3 flex flex-col gap-3">
        <FilterRow label="Ort">
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
              aria-current={filters.ort === option.value ? "true" : undefined}
              className={`${CHIP} ${
                filters.ort === option.value ? CHIP_ON : CHIP_OFF
              }`}
            >
              {option.label}
            </Link>
          ))}
        </FilterRow>

        <FilterRow label="Modell">
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
        </FilterRow>

        {active && (
          <Link
            href="/"
            className="inline-flex min-h-11 items-center self-start text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Filter zurücksetzen
          </Link>
        )}
      </div>
    </section>
  );
}

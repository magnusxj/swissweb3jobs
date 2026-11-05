import Link from "next/link";
import type { JobFilters, LocationFilter, WorkplaceFilter } from "@/lib/jobs";

const ORT_OPTIONS: { value: LocationFilter; label: string }[] = [
  { value: "zuerich", label: "Zürich" },
  { value: "zug", label: "Zug" },
  { value: "geneva", label: "Geneva" },
  { value: "remote", label: "Remote CH" },
];

const WORKPLACE_OPTIONS: WorkplaceFilter[] = ["Remote", "Hybrid", "On-site"];

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
const CHIP_ON = "border-slate-900 bg-slate-900 text-white";
const CHIP_OFF =
  "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900";

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
  const active = Boolean(filters.q || filters.ort || filters.workplace);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs sm:p-3">
      <form action="/" method="get" className="flex gap-2">
        {filters.ort && <input type="hidden" name="ort" value={filters.ort} />}
        {filters.workplace && (
          <input type="hidden" name="workplace" value={filters.workplace} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Role, company or keyword..."
          aria-label="Search jobs"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Search
        </button>
      </form>

      <div className="no-scrollbar -mx-0.5 mt-2 flex items-center gap-1.5 overflow-x-auto px-0.5 py-0.5">
        <span className="hidden shrink-0 pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:inline">
          Location
        </span>
        <Link
          href={hrefFor(filters, { ort: null })}
          aria-current={!filters.ort ? "true" : undefined}
          className={`${CHIP} ${!filters.ort ? CHIP_ON : CHIP_OFF}`}
        >
          All
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

        <span
          aria-hidden="true"
          className="mx-1 h-5 w-px shrink-0 bg-slate-200"
        />
        <span className="hidden shrink-0 pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:inline">
          Workplace
        </span>

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

        {active && (
          <Link
            href="/"
            className="ml-1 inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
          >
            Reset
          </Link>
        )}
      </div>
    </section>
  );
}

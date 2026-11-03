import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { PostJobButton } from "@/components/PostJobButton";
import { getJobs, parseFilters } from "@/lib/jobs";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 min-[360px]:block sm:text-[11px]">
              Crypto Valley · Schweiz
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-xl">
              Swiss Web3 Jobs
            </h1>
          </div>
          <PostJobButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        <p className="max-w-2xl text-sm text-slate-600">
          Handverlesene Blockchain- und FinTech-Stellen in Zug, Zürich und
          Remote Schweiz – für regulierte Institute, Stiftungen und
          Infrastruktur-Teams.
        </p>

        <Suspense fallback={<FeedSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

async function Results({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const jobs = getJobs(filters);

  return (
    <>
      <div className="mt-5">
        <FilterBar filters={filters} />
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
        <h2 className="text-sm font-medium text-slate-600">
          {jobs.length === 1 ? "1 Stelle" : `${jobs.length} Stellen`}
        </h2>
        {jobs.length > 0 && (
          <span className="text-xs text-slate-500">Neuste zuerst</span>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">
            Keine Jobs für diese Filter.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Suchbegriff kürzen oder Filter zurücksetzen.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mt-5 h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />
      <div className="mt-6 h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

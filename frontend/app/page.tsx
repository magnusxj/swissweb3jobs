import { Suspense } from "react";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { PostJobButton } from "@/components/PostJobButton";
import { getJobs, parseFilters } from "@/lib/jobs";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="relative overflow-hidden border-b border-zinc-800/80">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Schweiz · Web3 &amp; FinTech
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Swiss Web3 Jobs
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-zinc-400">
                Handverlesene Blockchain &amp; FinTech Stellen in Zug, Zürich
                &amp; Remote CH
              </p>
            </div>
            <PostJobButton className="mt-1" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
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
      <FilterBar filters={filters} />

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-400">
          {jobs.length === 1 ? "1 Stelle" : `${jobs.length} Stellen`}
        </h2>
        {jobs.length > 0 && (
          <span className="text-xs text-zinc-600">Neuste zuerst</span>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm font-medium text-zinc-300">
            Keine Jobs für diese Filter.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Suchbegriff kürzen oder Filter zurücksetzen.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
      <div className="h-36 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40" />
      <div className="mt-6 h-4 w-24 animate-pulse rounded bg-zinc-900" />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
          />
        ))}
      </div>
    </div>
  );
}

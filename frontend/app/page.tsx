import { JobCardList } from "@/components/JobCardList";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Suspense } from "react";
import { EmployerTeaser } from "@/components/EmployerTeaser";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { PostJobButton } from "@/components/PostJobButton";
import { getActiveJobs, getJobs, parseFilters } from "@/lib/jobs";



export default function Page({ searchParams }: PageProps<"/">) {
  const activeJobs = getActiveJobs();
  const jobCount = activeJobs.length;
  const teamCount = new Set(activeJobs.map((job) => job.company)).size;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <Hero jobCount={jobCount} teamCount={teamCount} />

      <main className="flex-1">
        <section
          id="jobs"
          className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-12 pt-10 sm:pt-12"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Open positions
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Browse Swiss Web3 jobs
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every role is reviewed for a Swiss team, a real hiring process, and
              a direct application link.
            </p>
          </div>

          <Suspense fallback={<FeedSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
        </section>

        <EmployerTeaser />
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
  const bookmarkedFilter = (await searchParams).bookmarked === "true";
  const hasFeatured = jobs.some((job) => job.is_featured === 1);

  return (
    <>
      <div className="sticky top-[69px] z-30 -mx-4 mt-6 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <FilterBar filters={filters} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-200 pb-2.5">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          />
          {jobs.length === 1
            ? "1 verified role in Crypto Valley"
            : `${jobs.length} verified roles in Crypto Valley`}
        </p>
        {jobs.length > 0 && (
          <span className="text-xs text-slate-500">
            {hasFeatured ? "Featured first · then newest" : "Newest first"}
          </span>
        )}
      </div>

            {bookmarkedFilter && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 border border-blue-100">
          <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <span className="text-xl">📌</span> Saved jobs active
          </p>
          <Link href="/#jobs" className="text-sm font-semibold text-blue-700 hover:text-blue-800 bg-white px-3 py-1.5 rounded shadow-sm border border-blue-200 transition">
            Show all jobs
          </Link>
        </div>
      )}
      <JobCardList jobs={jobs} bookmarkedFilter={bookmarkedFilter} />
    </>
  );
}

function FeedSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mt-6 h-[74px] animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="mt-6 h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 grid gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

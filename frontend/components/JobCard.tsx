import Link from "next/link";
import { TakedownLink } from "@/components/TakedownLink";
import type { Job } from "@/lib/jobs";
import { relativeDate } from "@/lib/jobs";
import { applyUrlWithRef } from "@/lib/links";
import { jobPath } from "@/lib/seo";

const BADGE = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";

function splitTags(tags: string | null): string[] {
  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function JobCard({ job }: { job: Job }) {
  const tags = splitTags(job.tags);
  const date = relativeDate(job.posted_at ?? job.created_at);
  const workplace = job.workplace_type ?? "On-site";

  return (
    <article className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-emerald-500/40 hover:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug text-zinc-100">
            <Link
              href={jobPath(job)}
              className="transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              {job.title}
            </Link>
          </h2>
          <p className="mt-0.5 truncate text-sm text-zinc-400">{job.company}</p>
        </div>
        {date && (
          <time
            dateTime={job.posted_at ?? job.created_at}
            className="shrink-0 text-xs text-zinc-500"
          >
            {date}
          </time>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`${BADGE} bg-zinc-800 text-zinc-300`}>
          {job.location}
        </span>
        <span className={`${BADGE} bg-indigo-500/10 text-indigo-300`}>
          {workplace}
        </span>
        {job.employment_type && (
          <span className={`${BADGE} bg-zinc-800/70 text-zinc-400`}>
            {job.employment_type}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 8).map((tag) => (
            <li
              key={tag}
              className="rounded border border-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-500"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-zinc-600">
            {job.source_site}
          </span>
          <TakedownLink job={job} />
        </div>
        <a
          href={applyUrlWithRef(job.apply_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Bewerben
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

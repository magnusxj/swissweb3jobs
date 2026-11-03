import Link from "next/link";
import { TakedownLink } from "@/components/TakedownLink";
import type { Job } from "@/lib/jobs";
import { applyUrlWithRef } from "@/lib/links";
import { jobDateLabel, jobPath } from "@/lib/seo";

function splitTags(tags: string | null): string[] {
  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function JobCard({ job }: { job: Job }) {
  const tags = splitTags(job.tags);
  const date = jobDateLabel(job);
  const workplace = job.workplace_type ?? "On-site";

  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug text-slate-900">
            <Link
              href={jobPath(job)}
              className="rounded-sm transition-colors after:absolute after:inset-0 after:content-[''] hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {job.title}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span className="font-medium text-slate-800">{job.location}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{workplace}</span>
            {job.employment_type && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>{job.employment_type}</span>
              </>
            )}
          </p>
        </div>
        {date && (
          <time
            dateTime={job.posted_at ?? job.created_at}
            className="shrink-0 text-xs text-slate-500"
          >
            {date}
          </time>
        )}
      </div>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 8).map((tag) => (
            <li
              key={tag}
              className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {job.source_site}
          </span>
          <TakedownLink job={job} className="relative z-10" />
        </div>
        <a
          href={applyUrlWithRef(job.apply_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
        >
          Bewerben
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

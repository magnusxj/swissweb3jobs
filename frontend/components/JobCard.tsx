"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Bookmark } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { companyDomain } from "@/lib/company";
import { applyUrlWithRef, resolveApplyUrl } from "@/lib/links";
import { jobDateLabel, jobPath, splitTags } from "@/lib/seo";

export function JobCard({ job }: { job: Job }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sw3_bookmarks");
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.includes(job.id)) {
          setIsBookmarked(true);
        }
      }
    } catch (e) {}
  }, [job.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("sw3_bookmarks");
      let ids: number[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) ids = parsed;
      }
      
      if (isBookmarked) {
        ids = ids.filter((id) => id !== job.id);
        setIsBookmarked(false);
      } else {
        ids.push(job.id);
        setIsBookmarked(true);
      }
      localStorage.setItem("sw3_bookmarks", JSON.stringify(ids));
      window.dispatchEvent(new Event("sw3_bookmarks_changed"));
    } catch (e) {}
  };
  // Max. 4 Tags auf Desktop, max. 3 auf Mobile.
  const tags = splitTags(job.tags).slice(0, 4);
  const date = jobDateLabel(job);
  const workplace = job.workplace_type ?? "On-site";
  const domain = companyDomain(job.company, job.apply_url);
  const applyHref = applyUrlWithRef(resolveApplyUrl(job));
  const featured = job.is_featured === 1;

  return (
    <article
      className={`group relative rounded-xl border bg-white p-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
        featured
          ? "border-slate-400 ring-1 ring-inset ring-blue-600/10 hover:border-slate-500"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2 sm:right-4 sm:top-4">
        {featured && (
          <span className="rounded-full border border-blue-600/20 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-900">
            Featured
          </span>
        )}
        <button 
          onClick={toggleBookmark}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label={isBookmarked ? "Job entfernen" : "Job merken"}
        >
          {isBookmarked ? (
            <Bookmark className="w-5 h-5 fill-[#e04f38] text-[#e04f38]" />
          ) : (
            <Bookmark className="w-5 h-5 text-slate-400 hover:text-slate-700" />
          )}
        </button>
      </div>

      <div className="flex items-start gap-3 sm:gap-3.5">
        <CompanyLogo company={job.company} domain={domain} />

        <div className="min-w-0 flex-1">
          <h2
            className={`text-[15px] font-semibold leading-snug tracking-tight text-slate-900 ${
              featured ? "pr-20" : ""
            }`}
          >
            <Link
              href={jobPath(job)}
              className="rounded-sm transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {job.title}
            </Link>
          </h2>

          <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
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
            {date && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <time
                  dateTime={job.posted_at ?? job.created_at}
                  className="text-slate-500"
                >
                  {date}
                </time>
              </>
            )}

            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative z-10 ml-auto hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:inline-flex"
            >
              Apply
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          {tags.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <li
                  key={tag}
                  className={`rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ${
                    index === 3 ? "hidden sm:inline-flex" : "inline-flex"
                  }`}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

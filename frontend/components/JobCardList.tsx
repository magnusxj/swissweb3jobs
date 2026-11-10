"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";

export function JobCardList({ jobs, bookmarkedFilter }: { jobs: any[], bookmarkedFilter: boolean }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const load = () => {
      try {
        const saved = localStorage.getItem("sw3_bookmarks");
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) setBookmarkedIds(ids);
        }
      } catch(e) {}
    };
    load();
    window.addEventListener("sw3_bookmarks_changed", load);
    return () => window.removeEventListener("sw3_bookmarks_changed", load);
  }, []);

  const visibleJobs = (bookmarkedFilter && isMounted) ? jobs.filter(j => bookmarkedIds.includes(j.id)) : jobs;

  if (visibleJobs.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-700">
          {bookmarkedFilter ? "Keine Jobs gespeichert." : "No jobs match these filters."}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {bookmarkedFilter ? "Klicke auf das Lesezeichen-Symbol eines Jobs, um ihn dir zu merken." : "Try a shorter keyword or reset the filters."}
        </p>
        {bookmarkedFilter && (
          <Link
            href="/#jobs"
            className="mt-4 inline-block px-4 py-2 bg-[#231b42] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
          >
            Alle Jobs anzeigen
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {visibleJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

import type { Job } from "@/lib/jobs";
import { takedownMailto } from "@/lib/links";

/** Dezenter Melde-Link (Takedown) für Cards und Detailseite. */
export function TakedownLink({
  job,
  className = "",
}: {
  job: Pick<Job, "id" | "title" | "company">;
  className?: string;
}) {
  return (
    <a
      href={takedownMailto(job)}
      className={`inline-flex min-h-11 items-center text-xs text-slate-500 transition-colors hover:text-slate-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${className}`}
    >
      Inserat melden / entfernen
    </a>
  );
}

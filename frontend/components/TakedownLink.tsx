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
      className={`text-xs text-zinc-500 transition-colors hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${className}`}
    >
      Inserat melden / entfernen
    </a>
  );
}

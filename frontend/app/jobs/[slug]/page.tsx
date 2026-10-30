import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobPostingJsonLd } from "@/components/JobPostingJsonLd";
import { Footer } from "@/components/Footer";
import { TakedownLink } from "@/components/TakedownLink";
import {
  getAllJobs,
  getJobBySlug,
  type Job,
} from "@/lib/jobs";
import { applyUrlWithRef } from "@/lib/links";
import {
  SITE_NAME,
  jobDateLabel,
  jobDescriptionParagraphs,
  jobPath,
  jobSeoDescription,
  jobSeoTitle,
  jobSlug,
  splitTags,
} from "@/lib/seo";

const BADGE =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";

function isArchived(job: Job): boolean {
  return job.status === "archived";
}

export async function generateStaticParams() {
  const jobs = getAllJobs();

  // Cache Components verlangt mindestens einen Param. Ohne DB (Build-Fallback)
  // liefern wir einen Platzhalter; die Seite läuft dafür sauber ins 404.
  if (jobs.length === 0) return [{ slug: "keine-jobs-verfuegbar" }];

  return jobs.map((job) => ({ slug: jobSlug(job) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};

  const title = jobSeoTitle(job);
  const description = jobSeoDescription(job);
  const canonical = jobPath(job);

  return {
    title,
    description,
    alternates: { canonical },
    ...(isArchived(job) ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "article",
      locale: "de_CH",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function JobPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  const archived = isArchived(job);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      {!archived && <JobPostingJsonLd job={job} />}

      <header className="border-b border-zinc-800/80">
        <div className="mx-auto w-full max-w-3xl px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <span aria-hidden="true">←</span>
            Alle Web3 &amp; FinTech Jobs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        {archived && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-amber-200">
              Hinweis: Dieses Inserat ist abgelaufen und nimmt keine Bewerbungen
              mehr an.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:mt-0"
            >
              Alle aktuellen Jobs ansehen
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        <JobHeader job={job} />

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-300">
          {jobDescriptionParagraphs(job).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            {archived
              ? "Dieses Inserat ist nicht mehr aktiv. Die Angaben bleiben zu Archivzwecken sichtbar."
              : "Bewerbung direkt über den Link unten. Das Inserat stammt aus einer öffentlichen Job-Quelle."}
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          {archived ? (
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-500"
            >
              Bewerbung geschlossen
            </span>
          ) : (
            <a
              href={applyUrlWithRef(job.apply_url)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Jetzt bewerben
              <span aria-hidden="true">↗</span>
            </a>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Quelle: {job.source_site}.{" "}
            {archived
              ? "Bewerbungen sind für dieses Inserat geschlossen."
              : "Bewerbung über den Anbieter."}
          </p>
          <p className="mt-2">
            <TakedownLink job={job} />
          </p>
        </div>
      </main>

      <Footer width="3xl" note="Angaben ohne Gewähr" />
    </div>
  );
}

function JobHeader({ job }: { job: Job }) {
  const tags = splitTags(job.tags);
  const date = jobDateLabel(job);

  return (
    <article>
      <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
        {SITE_NAME} · Quelle {job.source_site}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {job.title}
      </h1>
      <p className="mt-1 text-base text-zinc-400">{job.company}</p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className={`${BADGE} bg-zinc-800 text-zinc-300`}>
          {job.location}
        </span>
        <span className={`${BADGE} bg-indigo-500/10 text-indigo-300`}>
          {job.workplace_type ?? "On-site"}
        </span>
        {job.employment_type && (
          <span className={`${BADGE} bg-zinc-800/70 text-zinc-400`}>
            {job.employment_type}
          </span>
        )}
        {date && (
          <span className="ml-1 text-xs text-zinc-500">veröffentlicht {date}</span>
        )}
      </div>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded border border-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-500"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

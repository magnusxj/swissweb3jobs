import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
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

  // Nur die kanonische URL (Titel-ID) ist gueltig: /jobs/x-1 oder /jobs/1
  // leiten permanent auf /jobs/<titel>-<id> um statt Duplicate Content zu liefern.
  const canonicalSlug = jobSlug(job);
  if (slug !== canonicalSlug) permanentRedirect(`/jobs/${canonicalSlug}`);

  const archived = isArchived(job);
  const applyHref = applyUrlWithRef(job.apply_url);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      {!archived && <JobPostingJsonLd job={job} />}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Alle Jobs
          </Link>
          {!archived && (
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hidden min-h-11 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:inline-flex"
            >
              Bewerben
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-32 sm:pt-8 sm:pb-10">
        {archived && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-amber-900">
              Hinweis: Dieses Inserat ist abgelaufen und nimmt keine Bewerbungen
              mehr an.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex min-h-11 shrink-0 items-center rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:mt-0"
            >
              Alle aktuellen Jobs
            </Link>
          </div>
        )}

        <JobHeader job={job} />

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Stellenbeschreibung
          </h2>
          <div className="mt-3">
            <DescriptionBody paragraphs={jobDescriptionParagraphs(job)} />
          </div>
          <p className="mt-6 max-w-prose text-sm leading-6 text-slate-500">
            {archived
              ? "Dieses Inserat ist nicht mehr aktiv. Die Angaben bleiben zu Archivzwecken sichtbar."
              : "Bewerbung direkt über den Link. Das Inserat stammt aus einer öffentlichen Job-Quelle."}
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          {archived ? (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 cursor-not-allowed items-center rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-500"
            >
              Bewerbung geschlossen
            </span>
          ) : (
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Jetzt bewerben
              <span aria-hidden="true">↗</span>
            </a>
          )}
          <p className="mt-3 text-xs text-slate-500">
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

      {!archived && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex min-h-12 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-base font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Jetzt bewerben
          </a>
        </div>
      )}

      <div className="pb-20 sm:pb-0">
        <Footer width="3xl" note="Angaben ohne Gewähr" />
      </div>
    </div>
  );
}

/**
 * Stellt die Beschreibung wie ein Geschäftsdokument dar: Fliesstext als
 * Absätze, Aufzählungen (•) als echte Bullet-Liste. Reine Darstellung.
 */
function DescriptionBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="max-w-prose space-y-4 text-[15px] leading-7 text-slate-700">
      {paragraphs.map((paragraph, index) => {
        const [lead, ...items] = paragraph.split("•").map((part) => part.trim());
        const bullets = items.filter(Boolean);

        if (bullets.length === 0) {
          return <p key={index}>{paragraph}</p>;
        }

        return (
          <div key={index} className="space-y-3">
            {lead && <p>{lead}</p>}
            <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
              {bullets.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function JobHeader({ job }: { job: Job }) {
  const tags = splitTags(job.tags);
  const date = jobDateLabel(job);
  const facts = [
    { label: "Standort", value: job.location },
    { label: "Arbeitsmodell", value: job.workplace_type ?? "On-site" },
    { label: "Pensum", value: job.employment_type ?? "100%" },
    ...(date ? [{ label: "Veröffentlicht", value: date }] : []),
  ];

  return (
    <article>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {SITE_NAME} · Quelle {job.source_site}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {job.title}
      </h1>
      <p className="mt-1 text-base text-slate-600">{job.company}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200 py-4 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {fact.label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      {tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

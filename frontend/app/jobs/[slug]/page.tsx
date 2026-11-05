import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { CompanyLogo } from "@/components/CompanyLogo";
import { JobDescription } from "@/components/JobDescription";
import { JobPostingJsonLd } from "@/components/JobPostingJsonLd";
import { Footer } from "@/components/Footer";
import { TakedownLink } from "@/components/TakedownLink";
import {
  getAllJobs,
  getJobBySlug,
  type Job,
} from "@/lib/jobs";
import { companyCareersUrl, companyDomain } from "@/lib/company";
import { jobQuickFacts } from "@/lib/job-facts";
import { applyUrlWithRef, resolveApplyUrl } from "@/lib/links";
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
  const applyHref = applyUrlWithRef(resolveApplyUrl(job));
  const domain = companyDomain(job.company, job.apply_url);
  const websiteUrl = domain
    ? `https://${domain}`
    : companyCareersUrl(job.company);
  const descriptionText =
    job.summary?.trim() || jobDescriptionParagraphs(job).join("\n\n");
  const quickFacts = jobQuickFacts(job);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      {!archived && <JobPostingJsonLd job={job} />}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            All Jobs
          </Link>
          {!archived && (
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hidden min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:inline-flex"
            >
              Apply
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 sm:pt-8 sm:pb-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div className="min-w-0">
            {archived && (
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <p className="text-sm text-amber-900">
                  This listing has expired and is no longer accepting
                  applications.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex min-h-11 shrink-0 items-center rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:mt-0"
                >
                  All current jobs
                </Link>
              </div>
            )}

            <JobHeader job={job} />

            <section className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                JOB DESCRIPTION
              </h2>
              <div className="mt-3">
                <JobDescription text={descriptionText} />
              </div>
              <p className="mt-6 max-w-prose text-sm leading-6 text-slate-500">
                {archived
                  ? "This listing is no longer active. The details remain visible for archival purposes."
                  : "Apply directly via the link. This listing comes from a public job source."}
              </p>
            </section>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs text-slate-500">
                Report or request removal of this listing:
              </p>
              <TakedownLink job={job} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <CompanyLogo company={job.company} domain={domain} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-slate-900">
                    {job.company}
                  </p>
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                      Official website
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-5">
                {archived ? (
                  <span
                    aria-disabled="true"
                    className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-500"
                  >
                    Applications closed
                  </span>
                ) : (
                  <a
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    Apply Now
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                <p className="mt-2 text-center text-xs text-slate-500">
                  {archived
                    ? "Applications are closed."
                    : "Direct application via employer"}
                </p>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                <Fact label="LOCATION" value={job.location} />
                <Fact
                  label="WORK MODEL"
                  value={job.workplace_type ?? "On-site"}
                />
                <Fact
                  label="EMPLOYMENT"
                  value={job.employment_type ?? "100%"}
                />
                {jobDateLabel(job) && (
                  <Fact label="POSTED" value={jobDateLabel(job)} />
                )}
              </dl>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Key Requirements
                </h2>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <Fact
                    label="EXPERIENCE"
                    value={quickFacts.experience}
                  />
                  <Fact
                    label="DEPARTMENT"
                    value={quickFacts.department}
                  />
                </dl>

                {quickFacts.requirements.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Core Requirements
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {quickFacts.requirements.map((requirement) => (
                        <li
                          key={requirement}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>
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
            Apply Now
          </a>
        </div>
      )}

      <div className="pb-20 sm:pb-0">
        <Footer width="5xl" note="Details subject to change" />
      </div>
    </div>
  );
}

/**
 * Kompakte Faktenzeile für die Sticky-Action-Box.
 */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function JobHeader({ job }: { job: Job }) {
  const tags = splitTags(job.tags);
  const date = jobDateLabel(job);
  const facts = [
    { label: "LOCATION", value: job.location },
    { label: "WORK MODEL", value: job.workplace_type ?? "On-site" },
    { label: "EMPLOYMENT", value: job.employment_type ?? "100%" },
    ...(date ? [{ label: "POSTED", value: date }] : []),
  ];

  return (
    <article>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {SITE_NAME}
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
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

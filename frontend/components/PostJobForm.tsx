"use client";

import { useState } from "react";

const FIELD =
  "min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-0";
const LABEL = "text-[13px] font-medium text-slate-700";
const HINT = "mt-1 text-xs text-slate-500";

const STRIPE_CHECKOUT_URL =
  "https://buy.stripe.com/5kQ00l8eI4ZqgeI7K47g400";
const PENDING_JOB_KEY = "sw3_pending_job_post";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function withProtocol(value: string): string {
  if (!value) return "";
  return isHttpUrl(value) ? value : `https://${value}`;
}

const LOCATIONS = [
  "Zug",
  "Zurich",
  "Geneva",
  "Lausanne",
  "Remote (Switzerland)",
  "Hybrid",
];

const EMPLOYMENT_TYPES = [
  "Full-time 100%",
  "Part-time 80-100%",
  "Part-time <80%",
  "Contract / Freelance",
];

type FormState = {
  title: string;
  company: string;
  website: string;
  location: string;
  employment_type: string;
  apply: string;
  description: string;
  billing_email: string;
};

const INITIAL: FormState = {
  title: "",
  company: "",
  website: "",
  location: "Zug",
  employment_type: "Full-time 100%",
  apply: "",
  description: "",
  billing_email: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

export function PostJobForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) {
      next.title = "Please enter a job title.";
    }
    if (form.company.trim().length < 2) {
      next.company = "Please enter the company name.";
    }
    if (!form.website.trim()) {
      next.website = "Please enter the company website.";
    } else if (!isHttpUrl(withProtocol(form.website.trim()))) {
      next.website = "Please enter a valid website URL.";
    }
    if (!form.location.trim()) {
      next.location = "Please select a location.";
    }
    if (!form.employment_type.trim()) {
      next.employment_type = "Please select employment type and workload.";
    }
    const apply = form.apply.trim();
    if (!apply) {
      next.apply = "Please provide an application link or email.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(apply) &&
      !isHttpUrl(withProtocol(apply))
    ) {
      next.apply = "Please provide a valid application link or email.";
    }
    if (form.description.trim().length < 100) {
      next.description = "Please enter at least 100 characters of description.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billing_email.trim())) {
      next.billing_email = "Please enter a valid billing email.";
    }
    return next;
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-first-error]")?.focus();
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError();
      return;
    }

    setSubmitting(true);

    const billingEmail = form.billing_email.trim().toLowerCase();
    const payload = {
      ...form,
      title: form.title.trim(),
      company: form.company.trim(),
      website: withProtocol(form.website.trim()),
      location: form.location.trim(),
      employment_type: form.employment_type.trim(),
      apply: form.apply.trim(),
      description: form.description.trim(),
      billing_email: billingEmail,
    };

    try {
      const response = await fetch("/api/jobs/create-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        listingId?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !data.success || !data.listingId) {
        setErrors(data.errors ?? {});
        setError(
          data.error ??
            "Could not save your listing. Please try again in a moment.",
        );
        setSubmitting(false);
        if (data.errors && Object.keys(data.errors).length > 0) {
          focusFirstError();
        }
        return;
      }

      try {
        localStorage.setItem(
          PENDING_JOB_KEY,
          JSON.stringify({
            ...payload,
            listing_id: data.listingId,
            status: "pending_payment",
            saved_at: new Date().toISOString(),
          }),
        );
      } catch {
        // Private mode or full storage: the server already has the data.
      }

      const checkoutUrl = `${STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(
        billingEmail,
      )}&client_reference_id=${encodeURIComponent(data.listingId)}`;
      window.location.href = checkoutUrl;
    } catch {
      setError(
        "Could not reach the server. Please check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={LABEL}>
            Job Title <span className="text-slate-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. Senior Smart Contract Engineer"
            autoComplete="off"
            required
            minLength={3}
            maxLength={160}
            data-first-error={errors.title ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.title)}
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <label htmlFor="company" className={LABEL}>
            Company <span className="text-slate-400">*</span>
          </label>
          <input
            id="company"
            name="company"
            value={form.company}
            onChange={(event) => update("company", event.target.value)}
            placeholder="e.g. Sygnum Bank"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={120}
            data-first-error={errors.company ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.company)}
          />
          <FieldError message={errors.company} />
        </div>

        <div>
          <label htmlFor="website" className={LABEL}>
            Company Website <span className="text-slate-400">*</span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            placeholder="https://example.com"
            autoComplete="url"
            required
            data-first-error={errors.website ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.website)}
          />
          <FieldError message={errors.website} />
        </div>

        <div>
          <label htmlFor="location" className={LABEL}>
            Location <span className="text-slate-400">*</span>
          </label>
          <select
            id="location"
            name="location"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            required
            data-first-error={errors.location ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.location)}
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <FieldError message={errors.location} />
        </div>

        <div>
          <label htmlFor="employment_type" className={LABEL}>
            Employment Type &amp; Workload{" "}
            <span className="text-slate-400">*</span>
          </label>
          <select
            id="employment_type"
            name="employment_type"
            value={form.employment_type}
            onChange={(event) => update("employment_type", event.target.value)}
            required
            data-first-error={errors.employment_type ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.employment_type)}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError message={errors.employment_type} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="apply" className={LABEL}>
            Application Link or Email{" "}
            <span className="text-slate-400">*</span>
          </label>
          <input
            id="apply"
            name="apply"
            value={form.apply}
            onChange={(event) => update("apply", event.target.value)}
            placeholder="https://company.com/apply or jobs@company.com"
            autoComplete="off"
            required
            data-first-error={errors.apply ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.apply)}
          />
          <FieldError message={errors.apply} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={LABEL}>
            Job Description <span className="text-slate-400">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={10}
            required
            minLength={100}
            maxLength={4000}
            placeholder="Role overview, key responsibilities, requirements, and benefits... Markdown supported."
            data-first-error={errors.description ? "true" : undefined}
            className={`mt-1.5 min-h-40 resize-y py-2.5 leading-6 ${FIELD}`}
            aria-invalid={Boolean(errors.description)}
            aria-describedby="description-hint"
          />
          <p id="description-hint" className={HINT}>
            Markdown formatting supported. We review every listing within 24
            hours prior to activation.
          </p>
          <FieldError message={errors.description} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="billing_email" className={LABEL}>
            Billing Email <span className="text-slate-400">*</span>
          </label>
          <input
            id="billing_email"
            name="billing_email"
            type="email"
            value={form.billing_email}
            onChange={(event) => update("billing_email", event.target.value)}
            placeholder="billing@company.ch"
            autoComplete="email"
            required
            data-first-error={errors.billing_email ? "true" : undefined}
            className={`mt-1.5 ${FIELD}`}
            aria-invalid={Boolean(errors.billing_email)}
          />
          <p className={HINT}>
            Invoice and receipt will be sent to this address.
          </p>
          <FieldError message={errors.billing_email} />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {submitting
            ? "Saving listing …"
            : "Continue to Payment · 99 CHF"}
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Secure checkout via Stripe. No hidden fees or recurring subscriptions.
        </p>
      </div>
    </form>
  );
}

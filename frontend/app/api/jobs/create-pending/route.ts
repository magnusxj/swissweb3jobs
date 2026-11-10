import { NextResponse } from "next/server";
import {
  createPendingJob,
  type PendingJobInput,
} from "@/lib/pending-jobs";

type Payload = Partial<Record<keyof PendingJobInput, unknown>>;

function text(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = text(payload.title, 160);
  const company = text(payload.company, 120);
  const website = withProtocol(text(payload.website, 200));
  const location = text(payload.location, 80);
  const employmentType = text(payload.employment_type, 80);
  const apply = text(payload.apply, 300);
  const description = text(payload.description, 4000);
  const billingEmail = text(payload.billing_email, 160).toLowerCase();

  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "Please enter a job title.";
  if (company.length < 2) errors.company = "Please enter the company name.";
  if (!website || !isHttpUrl(website)) {
    errors.website = "Please enter a valid company website URL.";
  }
  if (!location) errors.location = "Please select a location.";
  if (!employmentType) {
    errors.employment_type = "Please select employment type and workload.";
  }
  if (!apply || (!isEmail(apply) && !isHttpUrl(withProtocol(apply)))) {
    errors.apply = "Please provide a valid application link or email.";
  }
  if (description.length < 100) {
    errors.description = "Please enter at least 100 characters of description.";
  }
  if (!billingEmail || !isEmail(billingEmail)) {
    errors.billing_email = "Please enter a valid billing email.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Please check your input.", errors },
      { status: 400 },
    );
  }

  try {
    const record = createPendingJob({
      title,
      company,
      website,
      location,
      employment_type: employmentType,
      apply,
      description,
      billing_email: billingEmail,
    });

    return NextResponse.json(
      {
        ok: true,
        listingId: record.listing_id,
        id: record.id,
        status: record.status,
        createdAt: record.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[jobs/create-pending] Save failed:", error);
    return NextResponse.json(
      {
        error:
          "Could not save your listing. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

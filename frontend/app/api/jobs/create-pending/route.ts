import { NextResponse } from "next/server";

const NOTIFY_EMAIL = "magnus.scherrer@gmail.com";
const FROM_EMAIL =
  process.env.MAIL_FROM?.trim() || "Swiss Web3 Jobs <onboarding@resend.dev>";

type PendingJobData = {
  listingId: string;
  title: string;
  company: string;
  website: string;
  location: string;
  employmentType: string;
  apply: string;
  description: string;
  billingEmail: string;
};

type Payload = {
  title?: unknown;
  company?: unknown;
  website?: unknown;
  location?: unknown;
  employment_type?: unknown;
  apply?: unknown;
  description?: unknown;
  billing_email?: unknown;
};

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

function createListingId(): string {
  return `SW3-${Date.now().toString(36).toUpperCase()}`;
}

function emailSubject(data: PendingJobData): string {
  return `[Neues Inserat] ${data.company} - ${data.title} (${data.listingId})`;
}

function emailText(data: PendingJobData): string {
  return [
    "Neues Job-Inserat über Swiss Web3 Jobs",
    "",
    `Listing ID: ${data.listingId}`,
    `Firma: ${data.company}`,
    `Website: ${data.website}`,
    `Job-Titel: ${data.title}`,
    `Standort: ${data.location}`,
    `Pensum: ${data.employmentType}`,
    `Bewerbungslink / E-Mail: ${data.apply}`,
    `Rechnungs-E-Mail: ${data.billingEmail}`,
    "",
    "Beschreibung:",
    data.description,
  ].join("\n");
}

function emailHtml(data: PendingJobData): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
  const description = data.description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  return `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;color:#0f172a">
  <h2 style="margin:0 0 12px">Neues Job-Inserat</h2>
  <table style="border-collapse:collapse;font-size:14px">
    ${row("Listing ID", data.listingId)}
    ${row("Firma", data.company)}
    ${row("Website", data.website)}
    ${row("Job-Titel", data.title)}
    ${row("Standort", data.location)}
    ${row("Pensum", data.employmentType)}
    ${row("Bewerbungslink / E-Mail", data.apply)}
    ${row("Rechnungs-E-Mail", data.billingEmail)}
  </table>
  <h3 style="margin:20px 0 8px">Beschreibung</h3>
  <p style="font-size:14px;line-height:1.6;white-space:normal">${description}</p>
</body></html>`;
}

/**
 * Verschickt die Inseratsdaten per Resend. Fehlt der API-Key oder schlägt der
 * Versand fehl, landen die Daten als Backup im Server-Log – der Kunde wird
 * nie blockiert.
 */
async function emailPendingJob(data: PendingJobData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.log("[PENDING_JOB_EMAIL_BACKUP]", JSON.stringify(data));
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        reply_to: data.billingEmail,
        subject: emailSubject(data),
        text: emailText(data),
        html: emailHtml(data),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[PENDING_JOB_EMAIL] Resend failed (${response.status}): ${detail}`,
      );
      console.log("[PENDING_JOB_EMAIL_BACKUP]", JSON.stringify(data));
    }
  } catch (error) {
    console.error("[PENDING_JOB_EMAIL] Resend request failed:", error);
    console.log("[PENDING_JOB_EMAIL_BACKUP]", JSON.stringify(data));
  }
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

  const listingId = createListingId();
  const data: PendingJobData = {
    listingId,
    title,
    company,
    website,
    location,
    employmentType,
    apply,
    description,
    billingEmail,
  };

  await emailPendingJob(data);

  return NextResponse.json({ success: true, listingId }, { status: 201 });
}

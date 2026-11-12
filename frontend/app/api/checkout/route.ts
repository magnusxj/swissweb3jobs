import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const PRICE_CHF = 9900;
const META_VALUE_MAX = 480;
const META_CHUNK_KEYS = 9;

/** Stripe-Metadaten sind auf 500 Zeichen pro Wert begrenzt. */
function metadataChunks(value: string): Record<string, string> {
  const chunks: Record<string, string> = {};
  for (let index = 0; index < META_CHUNK_KEYS; index += 1) {
    const chunk = value.slice(index * META_VALUE_MAX, (index + 1) * META_VALUE_MAX);
    if (chunk) chunks[`job_description_${index + 1}`] = chunk;
  }
  return chunks;
}

type CheckoutPayload = {
  title?: unknown;
  company?: unknown;
  website?: unknown;
  location?: unknown;
  employment_type?: unknown;
  apply?: unknown;
  description?: unknown;
  billing_email?: unknown;
};

function text(value: unknown, max = 500): string {
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
  if (isHttpUrl(value)) return value;
  return `https://${value}`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Please set STRIPE_SECRET_KEY in the environment.",
      },
      { status: 503 },
    );
  }

  let payload: CheckoutPayload;
  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
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
    errors.website = "Please enter a valid website URL.";
  }
  if (!location) errors.location = "Please select a location.";
  if (!employmentType) errors.employment_type = "Please select employment type and workload.";
  if (!apply || (!isEmail(apply) && !isHttpUrl(apply))) {
    errors.apply = "Please provide an application link or email.";
  }
  if (description.length < 100) {
    errors.description = "Please enter at least 100 characters of description.";
  }
  if (!billingEmail || !isEmail(billingEmail)) {
    errors.billing_email = "Please enter a valid billing email.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Please check your input.", errors }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    request.nextUrl.origin;

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "chf",
            unit_amount: PRICE_CHF,
            product_data: {
              name: "Featured Job Listing in Crypto Valley",
              description:
                "99 CHF one-time payment · 30 days active · sticky top placement · trust banner",
            },
          },
        },
      ],
      success_url: `${origin}/post-a-job/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/post-a-job`,
      customer_email: billingEmail,
      billing_address_collection: "required",
      metadata: {
        job_title: title,
        company,
        website,
        location,
        employment_type: employmentType,
        apply_url: apply,
        billing_email: billingEmail,
        description_parts: String(
          Math.min(
            META_CHUNK_KEYS,
            Math.ceil(description.length / META_VALUE_MAX),
          ),
        ),
        ...metadataChunks(description),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create checkout session." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Stripe-Fehler:", error);
    return NextResponse.json(
      {
        error:
          "Could not start Stripe checkout. Please try again later.",
      },
      { status: 502 },
    );
  }
}


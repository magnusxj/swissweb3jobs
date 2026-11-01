import { NextResponse, type NextRequest } from "next/server";
import { getJobBySlug } from "@/lib/jobs";
import { jobSlug } from "@/lib/seo";

/**
 * Kanonische Job-URLs durchsetzen, bevor die Seite rendert.
 *
 * Mit aktivierten Cache Components streamt Next die Detailseite und setzt den
 * HTTP-Status erst danach – notFound()/Redirect würden als 200-Soft-404
 * ankommen. Der Proxy liefert darum echte 404/301-Statuscodes.
 */
export const config = {
  matcher: ["/jobs/:slug"],
};

export function proxy(request: NextRequest) {
  const slug = decodeURIComponent(
    request.nextUrl.pathname.replace(/^\/jobs\//, ""),
  );
  const job = getJobBySlug(slug);

  // Unbekannte ID: echtes 404 mit der Not-Found-Seite der App.
  if (!job) {
    const notFoundResponse = NextResponse.rewrite(
      new URL("/_not-found", request.url),
      { status: 404 },
    );
    notFoundResponse.headers.set("x-robots-tag", "noindex");
    return notFoundResponse;
  }

  // ID existiert, Slug passt nicht: permanent auf die kanonische URL.
  const canonicalSlug = jobSlug(job);
  if (slug !== canonicalSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/jobs/${canonicalSlug}`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

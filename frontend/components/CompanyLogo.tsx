"use client";

import { useState } from "react";

/**
 * Quadratisches Firmen-Logo mit robustem Fallback:
 * Google-Favicon, sonst ein Initials-Badge mit dezentem Farbverlauf.
 */
export function CompanyLogo({
  company,
  domain,
}: {
  company: string;
  domain: string | null;
}) {
  const [failed, setFailed] = useState(false);

  const initials =
    company
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1.5 sm:h-[52px] sm:w-[52px] sm:p-2"
    >
      {domain && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
            domain,
          )}&sz=128`}
          alt=""
          width={128}
          height={128}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-blue-50 text-sm font-semibold tracking-wide text-slate-600">
          {initials}
        </span>
      )}
    </div>
  );
}

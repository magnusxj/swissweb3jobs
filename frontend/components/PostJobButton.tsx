const POST_JOB_EMAIL = "magnus.scherrer@gmail.com";

const POST_JOB_SUBJECT = "Job-Inserat aufgeben (Featured 99 CHF)";

const POST_JOB_BODY = [
  "Hallo Magnus,",
  "",
  "Ich möchte gerne folgende Stelle inserieren:",
  "- Jobtitel: ",
  "- Unternehmen: ",
  "- Standort / Remote-Modell: ",
  "- Bewerbungslink / Kontakt: ",
  "- Rechnungsadresse: ",
  "",
  "Freundliche Grüsse",
].join("\r\n");

/** Vorkonfigurierter Mailto-Link für Job-Inserate. */
export const POST_JOB_MAILTO = `mailto:${POST_JOB_EMAIL}?subject=${encodeURIComponent(
  POST_JOB_SUBJECT,
)}&body=${encodeURIComponent(POST_JOB_BODY)}`;

export function PostJobButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={POST_JOB_MAILTO}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-slate-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:gap-1.5 sm:px-3.5 sm:text-sm ${className}`}
    >
      <span aria-hidden="true">+</span>
      Job inserieren
    </a>
  );
}

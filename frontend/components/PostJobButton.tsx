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
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${className}`}
    >
      <span aria-hidden="true">+</span>
      Job inserieren
    </a>
  );
}

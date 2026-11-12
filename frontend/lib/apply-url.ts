const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Baut aus einem rohen Bewerbungsziel (URL oder E-Mail) einen sicheren Link.
 * E-Mail-Ziele werden zu `mailto:` mit vorausgefülltem Betreff, externe URLs
 * bekommen die Attribution-Parameter. Bestehende Query-Parameter bleiben
 * erhalten; ungültige Eingaben werden unverändert zurückgegeben.
 */
export function formatApplyUrl(rawInput: string, jobTitle: string): string {
  const input = rawInput.trim();
  if (!input) return input;

  const isMailto = /^mailto:/i.test(input);
  if (isMailto || EMAIL_PATTERN.test(input)) {
    const email = isMailto ? input.replace(/^mailto:/i, "").trim() : input;
    const subject = encodeURIComponent(
      `Application via Swiss Web3 Jobs: ${jobTitle}`,
    );
    return `mailto:${email}?subject=${subject}`;
  }

  const withProtocol =
    /^https?:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(withProtocol);
    url.searchParams.set("utm_source", "swissweb3jobs");
    url.searchParams.set("utm_medium", "job_board");
    return url.toString();
  } catch {
    return input;
  }
}

/** True, wenn der Link per Browser-Tab geöffnet werden soll (kein mailto). */
export function isExternalApplyUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

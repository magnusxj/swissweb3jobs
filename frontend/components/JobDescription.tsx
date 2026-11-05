/**
 * Stellenbeschreibung als lesbares Geschäftsdokument.
 *
 * Die Scraper liefern Plain Text mit "•"-Listen und Abschnittstiteln mitten im
 * Text. Der Parser macht daraus echte H2-Überschriften, Absätze und Listen –
 * ohne zusätzliche Markdown-Dependency und ohne gefährliches HTML.
 */

const SECTION_HEADINGS = [
  "About the role",
  "About the team",
  "About us",
  "About you",
  "Your role",
  "Your tasks",
  "Your profile",
  "Your responsibilities",
  "The role",
  "The team",
  "The company",
  "The Team",
  "Responsibilities",
  "Requirements",
  "Qualifications",
  "Nice to have",
  "Nice to Have",
  "Skills",
  "Experience",
  "What you'll do",
  "What you will do",
  "What we offer",
  "What we're looking for",
  "What we are looking for",
  "Our offer",
  "We offer",
  "Benefits",
  "Aufgaben",
  "Deine Aufgaben",
  "Anforderungen",
  "Dein Profil",
  "Das erwartet dich",
  "Das bieten wir",
  "Wir bieten",
];

const HEADING_ONLY = new RegExp(
  `^(${SECTION_HEADINGS.map((heading) =>
    heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})\\b[:\\-–]?\\s*`,
  "i",
);

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/** Lange Textwände in lesbare Absätze (max. ~3 Sätze) zerlegen. */
function splitLongParagraph(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= 420) return [trimmed];

  const sentences = trimmed.match(/[^.!?]+[.!?]+(?:["'»)]+)?|\S[^.!?]*$/g);
  if (!sentences || sentences.length < 2) return [trimmed];

  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (next.length > 360 && current) {
      paragraphs.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }

  if (current) paragraphs.push(current);
  return paragraphs;
}

function flushParagraph(target: Block[], buffer: string[]) {
  const text = buffer.join(" ").replace(/\s+/g, " ").trim();
  buffer.length = 0;
  if (!text) return;

  for (const paragraph of splitLongParagraph(text)) {
    target.push({ type: "paragraph", text: paragraph });
  }
}

function flushList(target: Block[], items: string[]) {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  items.length = 0;
  if (clean.length > 0) target.push({ type: "list", items: clean });
}

export function parseDescription(text: string): Block[] {
  const blocks: Block[] = [];
  const paragraph: string[] = [];
  const list: string[] = [];

  // Bullets in eigene Zeilen umwandeln; Zeilenumbrüche der Quelle bleiben
  // erhalten. Abschnittstitel werden nur noch zeilenweise erkannt, damit
  // Wörter wie "Experience" mitten im Satz nicht zu Überschriften werden.
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/\s*•\s*/g, "\n• ")
    .trim();

  const lines = normalized.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      flushList(blocks, list);
      flushParagraph(blocks, paragraph);
      continue;
    }

    // Markdown-Überschriften (#, ##, ###).
    const markdownHeading = /^#{1,6}\s+(.+)$/.exec(line);
    if (markdownHeading) {
      flushList(blocks, list);
      flushParagraph(blocks, paragraph);
      blocks.push({ type: "heading", text: markdownHeading[1].trim() });
      continue;
    }

    // Bekannter Abschnittstitel als eigene Zeile ("Responsibilities:").
    const knownHeading = line.length <= 80 ? HEADING_ONLY.exec(line) : null;
    if (knownHeading) {
      flushList(blocks, list);
      flushParagraph(blocks, paragraph);
      const rest = line.slice(knownHeading[0].length).trim();
      blocks.push({ type: "heading", text: knownHeading[1] });
      if (rest) {
        const restBullet = /^[-*•]\s+(.+)$/.exec(rest);
        if (restBullet) list.push(restBullet[1]);
        else paragraph.push(rest);
      }
      continue;
    }

    // Freistehende Kurzzeile vor einer Leerzeile: "About Crypto Finance".
    const nextBlank =
      index + 1 >= lines.length || lines[index + 1].trim() === "";
    const genericHeading =
      nextBlank &&
      line.length <= 64 &&
      line.split(/\s+/).length <= 9 &&
      !/[.!?,;:]$/.test(line) &&
      /^(About|Your|Our|The|Role|Team|Responsibilities|Requirements|Nice to Have|What|Why|Who|How|Key|Tasks|Profile|Skills|Experience|Qualifications|Benefits|Compensation|Location|We offer|You will|You have)\b/i.test(
        line,
      );
    if (genericHeading) {
      flushList(blocks, list);
      flushParagraph(blocks, paragraph);
      blocks.push({ type: "heading", text: line });
      continue;
    }

    // Bullet-Zeile.
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph(blocks, paragraph);
      list.push(bullet[1]);
      continue;
    }

    // Fliesstext beendet eine laufende Liste.
    flushList(blocks, list);
    paragraph.push(line);
  }

  flushList(blocks, list);
  flushParagraph(blocks, paragraph);

  return blocks;
}

/** **fett** und `code` ohne HTML-Injection rendern. */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
}

export function JobDescription({ text }: { text: string }) {
  const blocks = parseDescription(text);

  return (
    <div className="max-w-prose text-[15px] leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="mt-8 mb-3 border-b border-slate-100 pb-2 text-lg font-semibold tracking-tight text-slate-900 first:mt-0"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={index}
              className="my-4 list-disc space-y-2 pl-5 marker:text-slate-400"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="my-4 first:mt-0 last:mb-0">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

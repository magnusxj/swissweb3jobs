import type { Job } from "@/lib/jobs";
import { splitTags } from "@/lib/seo";

/**
 * Leitet aus Titel, Tags und Beschreibung kompakte Key-Facts für die
 * Detailseiten-Sidebar ab. Bewusst heuristisch: die Scraper liefern keine
 * strukturierten Seniority- oder Department-Felder.
 */
export type JobQuickFacts = {
  experience: string;
  department: string;
  requirements: string[];
};

const DEPARTMENT_RULES: { label: string; pattern: RegExp }[] = [
  {
    label: "Project Management",
    pattern: /\b(project manager|program manager|project lead|project management)\b/i,
  },
  {
    label: "Engineering",
    pattern:
      /\b(engineering|engineer|developer|software|solidity|rust|backend|frontend|full[- ]?stack|devops|sre|infrastructure|protocol|smart contract|blockchain)\b/i,
  },
  {
    label: "Product",
    pattern: /\b(product|platform owner|product owner)\b/i,
  },
  {
    label: "Finance & Operations",
    pattern:
      /\b(finance|financial|accounting|operations|treasury|reconciliation|custody|trading|payments|controlling)\b/i,
  },
  {
    label: "Compliance & Risk",
    pattern: /\b(compliance|risk|aml|kyc|regulatory|audit)\b/i,
  },
  {
    label: "Security",
    pattern: /\b(security|infosec|cyber)\b/i,
  },
  {
    label: "Legal",
    pattern: /\b(legal|counsel|lawyer)\b/i,
  },
  {
    label: "Sales & Business Development",
    pattern:
      /\b(sales|business development|account executive|relationship manager|partnership|revenue)\b/i,
  },
  {
    label: "Marketing & Community",
    pattern: /\b(marketing|growth|content|community|communications|brand)\b/i,
  },
  {
    label: "People & Talent",
    pattern: /\b(people|talent|recruit|human resources|hr)\b/i,
  },
  {
    label: "Data & Research",
    pattern: /\b(data|analyst|analytics|research|quant)\b/i,
  },
];

function experienceFromText(job: Job): string {
  const text = `${job.title}\n${job.summary ?? ""}`;

  const range = text.match(
    /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?|jahre)/i,
  );
  const plus = text.match(/(\d{1,2})\s*\+\s*(?:years?|yrs?|jahre)/i);
  const minimum = text.match(
    /(?:at least|minimum|min\.?)\s*(\d{1,2})\s*(?:years?|yrs?|jahre)/i,
  );

  const years = range
    ? `${range[1]}–${range[2]} yrs`
    : plus
      ? `${plus[1]}+ yrs`
      : minimum
        ? `${minimum[1]}+ yrs`
        : "";

  const title = job.title;
  const level = /\b(head|director|vp|chief|executive)\b/i.test(title)
    ? "Executive"
    : /\b(principal|staff|lead)\b/i.test(title)
      ? "Lead / Principal"
      : /\bsenior\b/i.test(title)
        ? "Senior"
        : /\b(junior|intern|internship|graduate|entry|werkstudent|praktik)/i.test(
              title,
            )
          ? "Entry / Junior"
          : "Mid-Level";

  return years ? `${level} · ${years}` : level;
}

function departmentFromJob(job: Job): string {
  const tags = splitTags(job.tags).join(" ");

  // Titel zuerst: er ist meist spezifischer als Freitext-Tags.
  for (const rule of DEPARTMENT_RULES) {
    if (rule.pattern.test(job.title)) return rule.label;
  }

  for (const rule of DEPARTMENT_RULES) {
    if (rule.pattern.test(tags)) return rule.label;
  }

  return "General";
}

/** Kurze Bullet-Zeilen aus der Beschreibung, falls keine Tags vorhanden sind. */
function bulletRequirements(text: string | null): string[] {
  if (!text) return [];

  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n|•/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter((line) => {
      const words = line.split(/\s+/).length;
      return line.length >= 12 && line.length <= 90 && words >= 2 && words <= 14;
    })
    .slice(0, 4);
}

export function jobQuickFacts(job: Job): JobQuickFacts {
  const tags = splitTags(job.tags).filter((tag) => {
    if (tag.toLowerCase() === job.company.trim().toLowerCase()) return false;
    if (/^[A-Z]{2}$/.test(tag)) return false;
    return true;
  });
  const requirements =
    tags.length > 0
      ? tags.slice(0, 6)
      : bulletRequirements(job.summary).map((line) =>
          line.length > 46 ? `${line.slice(0, 44).trimEnd()}…` : line,
        );

  return {
    experience: experienceFromText(job),
    department: departmentFromJob(job),
    requirements,
  };
}

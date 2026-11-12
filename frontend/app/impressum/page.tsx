import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

const MAIL = "magnus.scherrer@gmail.com";

const LINK =
  "text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

export const metadata: Metadata = {
  title: "Imprint",
  description:
    "Imprint and operator information for Swiss Web3 Jobs pursuant to Art. 3 Para. 1 lit. s UWG.",
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Imprint"
      subtitle="Operator information pursuant to Art. 3 Para. 1 lit. s UWG"
    >
      <LegalSection title="Project:">
        <p>Swiss Web3 Jobs</p>
      </LegalSection>

      <LegalSection title="Operator:">
        <p>Scherrer Jobplattformen (Magnus Scherrer)</p>
      </LegalSection>

      <LegalSection title="Address:">
        <p>
          Hausmatt 8
          <br />
          6405 Immensee
          <br />
          Switzerland
        </p>
      </LegalSection>

      <LegalSection title="Contact:">
        <p>
          Email:{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>
        </p>
        <p>
          This address handles inquiries about the portal, individual listings,
          the imprint, and privacy.
        </p>
      </LegalSection>

      <LegalSection title="Liability for content">
        <p>
          The content of this website is created with reasonable care. However,
          no guarantee is given for the accuracy, completeness, or timeliness of
          the content. As the operator, I am responsible for my own content under
          general law.
        </p>
        <p>
          Job listings are aggregated from publicly accessible sources. Details
          about the position, workload, location, and employer may be outdated or
          incomplete. Only the information provided by the respective advertiser
          is binding.
        </p>
      </LegalSection>

      <LegalSection title="Liability for links">
        <p>
          This website contains links to external websites and third-party
          application portals, in particular to the original listings and
          application pages of employers. I have no influence over their content
          and therefore cannot accept liability for this external content.
        </p>
        <p>
          The respective provider or operator is always responsible for the
          content of linked pages. At the time of linking, the pages were checked
          for possible legal violations; unlawful content was not identifiable. A
          permanent content review of linked pages is not reasonable without
          concrete evidence of a legal violation. If legal violations become
          known, I will remove such links immediately.
        </p>
      </LegalSection>

      <LegalSection title="Copyright">
        <p>
          The content and works created by the operator on this website are
          subject to Swiss copyright law. Reproduction, editing, distribution, and
          any kind of use outside the statutory limits require the written
          consent of the operator. Downloads and copies of this site are only
          permitted for private, non-commercial use.
        </p>
        <p>
          Where content on this page was not created by the operator, the
          copyrights of third parties are respected. In particular, job listings
          originate from public sources and belong to the respective advertisers.
          If a copyright infringement nevertheless exists, please provide a
          corresponding notice. If legal violations become known, I will remove
          such content immediately.
        </p>
      </LegalSection>

      <LegalSection title="Last updated">
        <p>October 2026</p>
      </LegalSection>
    </LegalPage>
  );
}

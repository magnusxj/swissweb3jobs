import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

const MAIL = "magnus.scherrer@gmail.com";

const LINK =
  "text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy of Swiss Web3 Jobs under the revised Swiss Data Protection Act (revFADP).",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="Information on the processing of personal data under the revFADP"
    >
      <LegalSection title="Controller">
        <p>
          The controller responsible for the processing of personal data on this
          website is:
        </p>
        <p>
          Magnus Scherrer
          <br />
          Hausmatt 8
          <br />
          6405 Immensee
          <br />
          Switzerland
          <br />
          Email:{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="General principle">
        <p>
          Personal data is processed only within the framework of the statutory
          provisions of the Swiss Data Protection Act (revFADP). This website is a
          publicly accessible job portal. There are no user accounts, no
          registration, and no login.
        </p>
      </LegalSection>

      <LegalSection title="Hosting and server logs">
        <p>
          When this website is accessed, the hosting provider records technical
          access data in server logs. This typically includes the IP address, date
          and time of access, the requested URL, the browser and operating system
          used, and the previously visited page if it is transmitted.
        </p>
        <p>
          This data is used exclusively for the secure and stable operation of the
          website, error analysis, and defence against attacks. It is not merged
          with other data sources and is not used to identify individuals. The
          processing is based on the overriding interest in secure and functional
          operation (Art. 31 Para. 1 revFADP). The logs are retained only for as
          long as necessary for these purposes.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and tracking">
        <p>
          This website does not use analytics, marketing, or profiling cookies. No
          third-party tracking or advertising services are integrated. No cookies
          of our own are required to operate the site.
        </p>
      </LegalSection>

      <LegalSection title="Applications and external links">
        <p>
          Applications are not submitted through this website. The “Apply” button
          leads directly to the application portal of the respective employer or
          to an external job platform. When you click it, you leave this website.
          The respective provider is responsible for the processing of personal
          data there – in particular the application data you enter. Their privacy
          policy applies.
        </p>
        <p>
          External links are opened with{" "}
          <code>rel=&quot;noopener noreferrer&quot;</code>. As a result, no
          referrer information about this website is transmitted to the provider
          when you navigate away. Clicking a link does not disclose data to third
          parties; any transmission is made directly by your browser to the
          provider you access.
        </p>
      </LegalSection>

      <LegalSection title="Disclosure to third parties">
        <p>
          Data is not sold and is not passed on for advertising purposes.
          Processing by third parties occurs only to the extent necessary to
          operate the website, for example by the hosting provider as a processor,
          or where a statutory obligation exists.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Under applicable law, you have in particular the right to information
          about the data processed relating to you, to rectification of incorrect
          data, to erasure, to restriction of processing, and to receive or
          transfer your data in a common electronic format. You may also object to
          processing where the statutory requirements are met.
        </p>
        <p>
          To exercise these rights, an email to{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>{" "}
          is sufficient. Suitable proof of identity may be required.
        </p>
        <p>
          You also have the right to lodge a complaint with the Swiss Federal Data
          Protection and Information Commissioner (FDPIC):{" "}
          <a
            href="https://www.edoeb.admin.ch"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            edoeb.admin.ch
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Data security">
        <p>
          Appropriate technical and organisational measures are taken to protect
          personal data against loss, misuse, and unauthorised access. However,
          absolute protection during data transmission over the internet cannot be
          guaranteed.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          This privacy policy may be amended if the website or the legal framework
          changes. The version published on this page applies.
        </p>
        <p>Last updated: October 2026</p>
      </LegalSection>
    </LegalPage>
  );
}

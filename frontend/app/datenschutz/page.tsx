import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

const MAIL = "magnus.scherrer@gmail.com";

const LINK =
  "text-emerald-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung von Swiss Web3 Jobs nach dem revidierten Schweizer Datenschutzgesetz (nDSG).",
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      subtitle="Informationen zur Bearbeitung personenbezogener Daten nach dem nDSG"
    >
      <LegalSection title="Verantwortlicher">
        <p>
          Verantwortlich für die Bearbeitung personenbezogener Daten auf dieser
          Website ist:
        </p>
        <p>
          Magnus Scherrer
          <br />
          Hausmatt 8
          <br />
          6405 Immensee
          <br />
          Schweiz
          <br />
          E-Mail:{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Grundsatz">
        <p>
          Personenbezogene Daten werden nur im Rahmen der gesetzlichen
          Bestimmungen des Schweizer Datenschutzgesetzes (nDSG) bearbeitet.
          Diese Website ist ein öffentlich zugängliches Stellenportal. Es gibt
          keine Nutzerkonten, keine Registrierung und keine Anmeldung.
        </p>
      </LegalSection>

      <LegalSection title="Hosting und Server-Logs">
        <p>
          Beim Aufruf dieser Website werden durch den Hosting-Anbieter
          technische Zugriffsdaten in Server-Logs erfasst. Dazu gehören
          typischerweise die IP-Adresse, Datum und Uhrzeit des Zugriffs, die
          aufgerufene URL, der verwendete Browser und das Betriebssystem sowie
          die zuvor besuchte Seite, sofern diese übermittelt wird.
        </p>
        <p>
          Diese Daten dienen ausschliesslich dem sicheren und stabilen Betrieb
          der Website, der Fehleranalyse und der Abwehr von Angriffen. Sie
          werden nicht mit anderen Datenquellen zusammengeführt und nicht zur
          Identifikation einzelner Personen verwendet. Die Bearbeitung stützt
          sich auf das überwiegende Interesse an einem sicheren und
          funktionsfähigen Betrieb (Art. 31 Abs. 1 nDSG). Die Logs werden nur so
          lange aufbewahrt, wie es für diese Zwecke erforderlich ist.
        </p>
      </LegalSection>

      <LegalSection title="Cookies und Tracking">
        <p>
          Diese Website setzt keine Analyse-, Marketing- oder
          Profiling-Cookies ein. Es werden keine Tracking- oder
          Werbedienste Dritter eingebunden. Für den Betrieb der Seite sind
          keine eigenen Cookies erforderlich.
        </p>
      </LegalSection>

      <LegalSection title="Bewerbungen und externe Links">
        <p>
          Bewerbungen erfolgen nicht über diese Website. Der Button
          «Bewerben» führt direkt zum Bewerbungsportal des jeweiligen
          Arbeitgebers oder zu einer externen Job-Plattform. Beim Klick
          verlassen Sie diese Website. Für die dortige Bearbeitung
          personenbezogener Daten – insbesondere der von Ihnen eingegebenen
          Bewerbungsdaten – ist der jeweilige Anbieter verantwortlich. Es gelten
          dessen Datenschutzbestimmungen.
        </p>
        <p>
          Die externen Links werden mit{" "}
          <code>rel=&quot;noopener noreferrer&quot;</code> geöffnet. Dadurch
          wird beim Wechsel keine Referrer-Information über diese Website an den
          Anbieter übermittelt. Eine Datenbekanntgabe an Dritte findet durch das
          blosse Anklicken eines Links nicht statt; eine allfällige Übermittlung
          erfolgt direkt durch Ihren Browser an den aufgerufenen Anbieter.
        </p>
      </LegalSection>

      <LegalSection title="Bekanntgabe an Dritte">
        <p>
          Daten werden nicht verkauft und nicht zu Werbezwecken weitergegeben.
          Eine Bearbeitung durch Dritte erfolgt nur, soweit dies für den Betrieb
          der Website notwendig ist, etwa durch den Hosting-Anbieter als
          Auftragsbearbeiter, oder soweit eine gesetzliche Pflicht besteht.
        </p>
      </LegalSection>

      <LegalSection title="Ihre Rechte">
        <p>
          Sie haben im Rahmen des anwendbaren Rechts insbesondere das Recht auf
          Auskunft über die zu Ihrer Person bearbeiteten Daten, auf Berichtigung
          unrichtiger Daten, auf Löschung, auf Einschränkung der Bearbeitung
          sowie auf Herausgabe oder Übertragung Ihrer Daten in einem gängigen
          elektronischen Format. Zudem können Sie einer Bearbeitung
          widersprechen, soweit die gesetzlichen Voraussetzungen erfüllt sind.
        </p>
        <p>
          Für die Ausübung dieser Rechte genügt eine E-Mail an{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>
          . Zur Identifikation kann ein geeigneter Nachweis verlangt werden.
        </p>
        <p>
          Sie haben ausserdem das Recht, sich beim Eidgenössischen Datenschutz-
          und Öffentlichkeitsbeauftragten (EDÖB) zu beschweren:{" "}
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

      <LegalSection title="Datensicherheit">
        <p>
          Es werden angemessene technische und organisatorische Massnahmen
          getroffen, um personenbezogene Daten gegen Verlust, Missbrauch und
          unbefugten Zugriff zu schützen. Ein absoluter Schutz bei der
          Datenübertragung über das Internet kann jedoch nicht garantiert
          werden.
        </p>
      </LegalSection>

      <LegalSection title="Änderungen">
        <p>
          Diese Datenschutzerklärung kann angepasst werden, wenn sich die
          Website oder die rechtlichen Rahmenbedingungen ändern. Es gilt die
          jeweils auf dieser Seite veröffentlichte Fassung.
        </p>
        <p>Stand: Oktober 2026</p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

const MAIL = "magnus.scherrer@gmail.com";

const LINK =
  "text-emerald-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "Impressum und Betreiberangaben von Swiss Web3 Jobs gemäss Art. 3 Abs. 1 Bst. s UWG.",
  alternates: { canonical: "/impressum" },
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      subtitle="Betreiberangaben gemäss Art. 3 Abs. 1 Bst. s UWG"
    >
      <LegalSection title="Betreiber">
        <p>
          Magnus Scherrer
          <br />
          Hausmatt 8
          <br />
          6405 Immensee
          <br />
          Schweiz
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          E-Mail:{" "}
          <a href={`mailto:${MAIL}`} className={LINK}>
            {MAIL}
          </a>
        </p>
        <p>
          Diese Adresse ist zuständig für Anfragen zum Portal, zu einzelnen
          Inseraten sowie zu Impressum und Datenschutz.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte">
        <p>
          Die Inhalte dieser Website werden mit angemessener Sorgfalt erstellt.
          Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird
          jedoch keine Gewähr übernommen. Als Betreiber bin ich für eigene
          Inhalte nach den allgemeinen Gesetzen verantwortlich.
        </p>
        <p>
          Job-Inserate werden aus öffentlich zugänglichen Quellen aggregiert.
          Angaben zu Stelle, Pensum, Standort und Arbeitgeber können veraltet
          oder unvollständig sein. Verbindlich sind ausschliesslich die Angaben
          des jeweiligen Anbieters.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Links">
        <p>
          Diese Website enthält Links zu externen Websites und Bewerbungsportalen
          Dritter, insbesondere zu den Original-Inseraten und Bewerbungsseiten
          der Arbeitgeber. Auf deren Inhalte habe ich keinen Einfluss. Deshalb
          kann ich für diese fremden Inhalte keine Gewähr übernehmen.
        </p>
        <p>
          Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
          oder Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung wurden die
          Seiten auf mögliche Rechtsverstösse überprüft; rechtswidrige Inhalte
          waren nicht erkennbar. Eine permanente inhaltliche Kontrolle der
          verlinkten Seiten ist ohne konkrete Anhaltspunkte einer
          Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
          Rechtsverletzungen entferne ich solche Links unverzüglich.
        </p>
      </LegalSection>

      <LegalSection title="Urheberrecht">
        <p>
          Die durch den Betreiber erstellten Inhalte und Werke auf dieser
          Website unterliegen dem schweizerischen Urheberrecht. Die
          Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
          ausserhalb der gesetzlichen Grenzen bedürfen der schriftlichen
          Zustimmung des Betreibers. Downloads und Kopien dieser Seite sind nur
          für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
        <p>
          Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
          wurden, werden die Urheberrechte Dritter beachtet. Insbesondere
          stammen Job-Inserate aus öffentlichen Quellen und gehören den
          jeweiligen Anbietern. Sollte trotzdem eine Urheberrechtsverletzung
          vorliegen, bitte ich um einen entsprechenden Hinweis. Bei
          Bekanntwerden von Rechtsverletzungen entferne ich solche Inhalte
          unverzüglich.
        </p>
      </LegalSection>

      <LegalSection title="Stand">
        <p>Oktober 2026</p>
      </LegalSection>
    </LegalPage>
  );
}

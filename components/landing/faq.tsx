"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question:
      "Wie funktioniert die Integration mit meiner bestehenden Praxissoftware?",
    answer:
      "Voicall lässt sich nahtlos in Ihre bestehenden Systeme integrieren. Wir unterstützen Google Calendar, Doctolib und andere gängige Praxismanagementsysteme. Die Integration erfolgt über sichere APIs ohne Datenverlust. Unser Support-Team hilft Ihnen bei der Einrichtung.",
  },
  {
    question: "Ist Voicall DSGVO-konform?",
    answer:
      "Ja, Voicall ist vollständig DSGVO-konform. Unsere Server stehen in der Schweiz, alle Daten werden verschlüsselt übertragen und gespeichert. Wir arbeiten mit EU-basierten KI-Providern und garantieren höchste Datenschutzstandards für medizinische Daten. Ein Data Processing Agreement (DPA) ist inklusive.",
  },
  {
    question: "Welche Kosten kommen auf mich zu?",
    answer:
      "Unsere Preise sind transparent und ohne versteckte Kosten. Sie zahlen eine monatliche Gebühr basierend auf Ihrem gewählten Plan (Starter 199 CHF, Pro 349 CHF, Enterprise 499 CHF). Alle Pläne beinhalten die KI-Anrufannahme, Terminverwaltung und Support. Keine Einrichtungsgebühren, keine langfristige Bindung.",
  },
  {
    question: "Wie lange dauert die Einrichtung?",
    answer:
      "Die Einrichtung von Voicall dauert in der Regel 1-2 Stunden. Nach der Registrierung erhalten Sie Zugang zu Ihrem Dashboard, wo Sie Ihren KI-Assistenten konfigurieren können. Unser Onboarding-Team unterstützt Sie bei der Kalenderintegration und dem Training der KI auf Ihre spezifischen Bedürfnisse. Innerhalb eines Tages sind Sie startklar.",
  },
  {
    question: "Kann ich Voicall testen, bevor ich mich entscheide?",
    answer:
      "Ja! Wir bieten eine 14-tägige kostenlose Testphase für alle Pläne an. Sie können Voicall unverbindlich testen und sich selbst von der Qualität überzeugen. Keine Kreditkarte erforderlich. Nach der Testphase können Sie entscheiden, ob Sie einen kostenpflichtigen Plan wählen möchten.",
  },
  {
    question: "Wie funktioniert der Support?",
    answer:
      "Unser Support-Team ist per E-Mail, Chat und Telefon erreichbar. Standard-Support ist in allen Plänen enthalten (Mo-Fr 9-17 Uhr). Pro-Kunden erhalten priorisierten Support. Enterprise-Kunden haben 24/7 Premium-Support mit persönlichem Account Manager. Zusätzlich bieten wir ein umfangreiches Help Center mit Tutorials und Dokumentation.",
  },
  {
    question: "Versteht die KI wirklich Schweizerdeutsch?",
    answer:
      "Ja! Voicall wurde speziell für den Schweizer Markt entwickelt und versteht verschiedene Schweizerdeutsche Dialekte. Die KI wurde mit tausenden Gesprächen aus Schweizer Arztpraxen trainiert und kann natürlich auf Schweizerdeutsch kommunizieren. Falls gewünscht, kann die KI auch Hochdeutsch, Französisch oder Italienisch sprechen.",
  },
  {
    question: "Was passiert bei technischen Problemen oder Ausfällen?",
    answer:
      "Voicall garantiert eine Verfügbarkeit von 99.9%. Bei technischen Problemen haben wir ein automatisches Fallback-System: Anrufe werden an eine von Ihnen definierte Backup-Nummer weitergeleitet. Sie erhalten sofort eine Benachrichtigung über jeden Ausfall. Unser technisches Team arbeitet 24/7 an der Lösung von Problemen.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Häufig gestellte{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              Fragen
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Hier finden Sie Antworten auf die am häufigsten gestellten Fragen zu
            Voicall. Wenn Sie weitere Fragen haben, kontaktieren Sie uns gerne
            direkt.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-2 rounded-md px-6 data-[state=open]:border-blue-900/30 data-[state=open]:bg-blue-950/5"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:text-blue-900 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-blue-950/5 to-purple-50 rounded-md border-2 border-blue-900/20">
          <p className="text-gray-700 text-lg">
            Weitere Fragen?{" "}
            <a
              href="mailto:contact@voicall.ch"
              className="text-blue-900 hover:text-blue-950 font-semibold hover:underline"
            >
              Kontaktieren Sie uns direkt
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

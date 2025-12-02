"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left border-b border-gray-100 hover:bg-gray-50/50"
      >
        <span className="text-base font-medium text-gray-900 pr-4">
          {question}
        </span>
        <div
          className={cn(
            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
            isOpen
              ? "bg-blue-900 text-white"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {isOpen ? (
            <Minus className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </div>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="py-4 text-gray-600 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-blue-900 bg-blue-100 rounded-full">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Häufig gestellte Fragen
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Weitere Fragen?{" "}
            <a
              href="mailto:contact@voicall.ch"
              className="text-blue-900 hover:text-blue-950 font-medium hover:underline"
            >
              Kontaktieren Sie uns direkt
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

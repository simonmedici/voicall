import { ShieldCheck, Languages, Lock, Server, Eye, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

const complianceFeatures = [
  {
    icon: ShieldCheck,
    title: "DSGVO & DSG konform",
    description:
      "Voicall erfüllt die Anforderungen des Schweizer Datenschutzgesetzes (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO) für alle Branchen.",
    highlight: true,
  },
  {
    icon: Lock,
    title: "End-to-End Verschlüsselung",
    description:
      "Alle Gespräche sind während der Übertragung vollständig verschlüsselt. Ihre Kundendaten sind jederzeit geschützt.",
  },
  {
    icon: Server,
    title: "Keine Audioaufnahmen",
    description:
      "Im Gegensatz zu herkömmlichen Anrufbeantwortern werden keine Audioaufnahmen erstellt oder dauerhaft archiviert.",
  },
  {
    icon: Eye,
    title: "Transparente Verarbeitung",
    description:
      "Anrufer werden zu Beginn jedes Gesprächs informiert. Vollständige Transparenz über die KI-gestützte Verarbeitung.",
  },
  {
    icon: CreditCard,
    title: "Sichere Transaktionen",
    description:
      "Für E-Commerce: Keine Speicherung von Zahlungsdaten. Alle sensiblen Informationen werden in Echtzeit verarbeitet und sofort verworfen.",
  },
  {
    icon: Languages,
    title: "Schweizerdeutsch-Kompetenz",
    description:
      "Unser KI-Assistent versteht alle Schweizer Dialekte - von Züritüütsch bis Bärndütsch. Ihre Kunden können natürlich sprechen.",
    highlight: true,
  },
];

const onboardingSteps = [
  {
    step: 1,
    title: "Plan wählen",
    description: "Wählen Sie den passenden Plan für Ihr Unternehmen",
    details: ["Starter, Pro oder Enterprise", "Flexible Minutenpakete", "Jederzeit skalierbar"],
  },
  {
    step: 2,
    title: "Onboarding-Termin",
    description: "Persönliche Beratung mit unserem Experten-Team",
    details: ["Analyse Ihrer Anforderungen", "Branchenspezifische Anpassungen", "Integrations-Planung"],
  },
  {
    step: 3,
    title: "KI-Agent Erstellung",
    description: "Wir entwickeln Ihren individuellen Assistenten",
    details: ["Massgeschneiderte Gesprächsführung", "Branchenspezifisches Training", "Schweizerdeutsch-Optimierung"],
  },
  {
    step: 4,
    title: "Testphase",
    description: "Sie testen Ihren KI-Agenten",
    details: ["Feintuning nach Feedback", "Optimierung der Antworten"],
  },
  {
    step: 5,
    title: "Go-Live",
    description: "Ihr KI-Assistent geht in den Produktivbetrieb",
    details: ["Nahtlose Aktivierung", "24/7 Monitoring", "Laufender Support"],
  },
];

export function Compliance() {
  return (
    <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Datenschutz für alle Branchen</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Maximaler Datenschutz,{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Null Kompromisse
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Kundendaten sind sensibel - egal ob Patient, Gast oder Käufer. Voicall setzt auf höchste Datenschutzstandards für jede Branche.
          </p>
        </div>

        {/* Main Compliance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {complianceFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`p-8 hover:shadow-xl transition-all duration-300 border-2 ${
                  feature.highlight
                    ? "border-green-200 bg-green-50/50"
                    : "hover:border-green-200/50"
                }`}
              >
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${
                    feature.highlight
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`h-7 w-7 ${
                      feature.highlight ? "text-green-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Onboarding Process */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border border-gray-200 p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>In 5 Schritten zu Ihrem KI-Assistenten</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              So funktioniert die Umsetzung
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {onboardingSteps.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col"
              >
                {/* Step Number integrated in card */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                
                {/* Details */}
                <ul className="space-y-2 mt-auto">
                  {item.details.map((detail, i) => (
                    <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white border-2 border-green-200 rounded-2xl px-8 py-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">DSGVO/DSG Garantie</p>
                <p className="text-sm text-gray-600">Für alle Branchen zertifiziert</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🇨🇭</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Swiss Made Quality</p>
                <p className="text-sm text-gray-600">Entwickelt für Schweizer Unternehmen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

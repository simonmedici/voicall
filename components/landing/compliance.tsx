import { ShieldCheck, Languages, Lock, Server, Eye, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const complianceFeatures = [
  {
    icon: ShieldCheck,
    title: "Zero PII-Retention",
    description:
      "Keine Patientendaten werden auf unseren Servern gespeichert. Gespräche werden in Echtzeit verarbeitet und sofort gelöscht - ohne Ausnahme.",
    highlight: true,
  },
  {
    icon: Lock,
    title: "End-to-End Verschlüsselung",
    description:
      "Alle Gespräche sind während der Übertragung vollständig verschlüsselt. Ihre Patientendaten sind jederzeit geschützt.",
  },
  {
    icon: Server,
    title: "Keine Audioaufnahmen",
    description:
      "Im Gegensatz zu herkömmlichen Anrufbeantwortern werden keine Audioaufnahmen erstellt oder archiviert.",
  },
  {
    icon: Eye,
    title: "DSG & DSGVO konform",
    description:
      "Unsere Lösung erfüllt die Anforderungen des Schweizer Datenschutzgesetzes (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO).",
  },
  {
    icon: FileCheck,
    title: "Transparente Datenverarbeitung",
    description:
      "Patienten werden zu Beginn jedes Gesprächs informiert. Vollständige Transparenz über die KI-gestützte Verarbeitung.",
  },
  {
    icon: Languages,
    title: "Schweizerdeutsch-Kompetenz",
    description:
      "Unser KI-Assistent versteht alle Schweizer Dialekte - von Züritüütsch bis Bärndütsch. Ihre Patienten können natürlich sprechen.",
    highlight: true,
  },
];

export function Compliance() {
  return (
    <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Datenschutz für Arztpraxen</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Maximaler Datenschutz,{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Null Kompromisse
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Patientendaten sind sensibel. Deshalb setzen wir auf den höchsten
            Datenschutzstandard: Zero PII-Retention bedeutet, dass keine
            personenbezogenen Daten gespeichert werden.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white border-2 border-green-200 rounded-2xl px-8 py-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Zero-Retention Garantie</p>
                <p className="text-sm text-gray-600">Keine Speicherung von Patientendaten</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🇨🇭</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Swiss Made Quality</p>
                <p className="text-sm text-gray-600">Entwickelt für Schweizer Praxen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

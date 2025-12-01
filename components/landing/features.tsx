import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Languages,
  Plug,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Phone,
    title: "24/7 erreichbar",
    description:
      "Keine verpassten Anrufe mehr - unser KI-Assistent ist rund um die Uhr für Ihre Kunden da und versteht Schweizerdeutsch perfekt.",
  },
  {
    icon: Calendar,
    title: "Termine & Reservierungen",
    description:
      "Automatische Terminvergabe und Reservierungsannahme in Echtzeit. Integration mit Google Calendar, Doctolib und mehr.",
  },
  {
    icon: MessageSquare,
    title: "Anfragen beantworten",
    description:
      "Beantwortet häufige Fragen zu Öffnungszeiten, Produkten, Services und Verfügbarkeit - ohne Wartezeit für Ihre Kunden.",
  },
  {
    icon: Clock,
    title: "Stosszeiten meistern",
    description:
      "Während Stosszeiten nimmt Voicall alle Anrufe entgegen. Kein Kunde hört mehr ein Besetztzeichen oder wartet in der Warteschleife.",
  },
  {
    icon: Languages,
    title: "Mehrsprachig inkl. Dialekte",
    description:
      "Versteht Hochdeutsch, Schweizerdeutsch (alle Dialekte), Französisch und Italienisch. Ihre Kunden sprechen natürlich.",
  },
  {
    icon: Plug,
    title: "Einfache Integration",
    description:
      "Nahtlose Anbindung an bestehende Systeme wie Doctolib, Reservierungssysteme, CRMs und Kalenderlösungen.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Wie Voicall Ihr Business{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              unterstützt
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Entlasten Sie Ihr Team und verbessern Sie die Kundenerfahrung mit
            unserer KI-Telefonlösung - nur eingehende Anrufe, keine Outbound-Calls.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-900/20 bg-white"
              >
                <div className="h-14 w-14 bg-gradient-to-br from-blue-950/10 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Icon className="h-7 w-7 text-blue-900" />
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

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-lg mb-6">
            Voicall passt sich flexibel Ihren Bedürfnissen an und integriert sich
            nahtlos in Ihre bestehenden Systeme.
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            Fokussiert auf Inbound - für maximale Effizienz 🇨🇭
          </p>
        </div>
      </div>
    </section>
  );
}

import {
  Phone,
  Calendar,
  PhoneCall,
  XCircle,
  ListChecks,
  Plug,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Phone,
    title: "24/7 erreichbar",
    description:
      "Keine verpassten Anrufe mehr - unser KI-Assistent ist rund um die Uhr für Ihre Patienten da und versteht Schweizerdeutsch perfekt.",
  },
  {
    icon: Calendar,
    title: "Automatische Terminvergabe",
    description:
      "Voicall koordiniert Termine in Echtzeit und passt sich Ihrem Kalender an. Integration mit Google Calendar und Doctolib.",
  },
  {
    icon: PhoneCall,
    title: "Outbound-Calls",
    description:
      "Automatische Erinnerungen und Nachsorge-Anrufe für optimale Patientenbetreuung und weniger No-Shows.",
  },
  {
    icon: XCircle,
    title: "Cancellations",
    description:
      "Automatische Verwaltung von Stornierungen mit sofortiger Wiederbesetzung freier Termine aus der Warteliste.",
  },
  {
    icon: ListChecks,
    title: "Wartelisten",
    description:
      "Intelligente Verwaltung von Wartelisten für optimale Auslastung Ihrer Praxis und zufriedene Patienten.",
  },
  {
    icon: Plug,
    title: "Integration mit bestehenden Systemen",
    description:
      "Nahtlose Anbindung an Doctolib, Google Calendar und andere Praxismanagementsysteme ohne Systemwechsel.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Wie Voicall Ihre Praxis{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              unterstützt
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Entlasten Sie Ihr Praxisteam und verbessern Sie die
            Patientenerfahrung mit unserer KI-Telefonlösung.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-900/20"
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
            Unser KI-Telefonassistent passt sich flexibel Ihren Bedürfnissen an
            und integriert sich nahtlos in Ihre Systeme.
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            Automatisierte Anrufe, die Sinn machen! 🇨🇭
          </p>
        </div>
      </div>
    </section>
  );
}

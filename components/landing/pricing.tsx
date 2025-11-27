import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tier: "starter",
    price: "199",
    description: "Für kleine Praxen oder Einzelpersonen",
    popular: false,
    features: [
      "KI-Anrufannahme 24/7",
      "500 Minuten/Monat",
      "Terminverwaltung",
      "1 Kalenderintegration",
      "E-Mail Benachrichtigungen",
      "Standard-Support",
      "Schweizerdeutsch Support",
    ],
  },
  {
    name: "Pro",
    tier: "pro",
    price: "349",
    description: "Für größere Praxen mit höherem Volumen",
    popular: true,
    features: [
      "KI-Anrufannahme 24/7",
      "1500 Minuten/Monat",
      "Termin- & Stornomanagement",
      "3 Kalenderintegrationen",
      "Wartelisten-Verwaltung",
      "Outbound-Calls",
      "Priorisierter Support",
      "Basis-Analytik",
      "Schweizerdeutsch Support",
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "499",
    description: "Für medizinische Einrichtungen jeder Größe",
    popular: false,
    features: [
      "KI-Anrufannahme (Inbound & Outbound)",
      "Unbegrenzte Minuten",
      "Vollständige Terminverwaltung",
      "Automatisierungen",
      "Wartelisten",
      "Unbegrenzte Kalenderintegrationen",
      "Erweiterte Analytik",
      "24/7 Premium-Support",
      "Anpassbare Workflows",
      "Schweizerdeutsch Support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Transparente{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              Preisgestaltung
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Wählen Sie den Plan, der am besten zu Ihren Anforderungen passt.
            Alle Pläne beinhalten eine kostenlose Testphase.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-stretch">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative flex flex-col ${
                plan.popular
                  ? "border-4 border-blue-900 shadow-2xl scale-105"
                  : "border-2"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-900 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>BELIEBT</span>
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">CHF/Monat</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/register?plan=${plan.tier}`} className="block mt-auto">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-950 hover:to-purple-700"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.popular ? "Jetzt starten" : "Plan wählen"}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Custom Plan CTA */}
        <Card className="p-8 bg-gradient-to-r from-blue-950/5 to-purple-50 border-2 border-blue-900/20">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Kein Plan passt perfekt?
            </h3>
            <p className="text-gray-600 mb-6">
              Wir bieten flexible Lösungen für jede Praxisgröße. Sagen Sie uns,
              was Sie brauchen – wir kümmern uns um den Rest.
            </p>
            <Link href="/register?plan=enterprise">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-950 hover:to-purple-700"
              >
                Individuelles Angebot anfordern
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}

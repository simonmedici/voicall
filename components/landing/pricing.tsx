import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap, Info } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tier: "starter",
    price: "199",
    description: "Für kleine Unternehmen",
    popular: false,
    minutesIncluded: 200,
    features: [
      { text: "200 Minuten inklusive", highlight: true, suffix: "(danach 0.25/Min)" },
      { text: "Ein Voice Bot", highlight: false },
      { text: "Sprache: Deutsch", highlight: false },
      { text: "Web Dashboard (Summaries)", highlight: false },
      { text: "Max. 4 Webpages Knowhow", highlight: false },
    ],
  },
  {
    name: "Pro",
    tier: "pro",
    price: "399",
    description: "Für wachsende Unternehmen",
    popular: true,
    minutesIncluded: 1000,
    features: [
      { text: "1000 Minuten inklusive", highlight: true, suffix: "(danach 0.25/Min)" },
      { text: "Multilingual DE/EN/FR/IT", highlight: false },
      { text: "Rechnungs- & Order Lookup", highlight: false },
      { text: "Web Dashboard (Summaries)", highlight: false },
      { text: "Weiterleitung to Human", highlight: false },
      { text: "ERP/CRM Anbindungen", highlight: false },
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "549",
    description: "Für etablierte Unternehmen",
    popular: false,
    minutesIncluded: -1,
    features: [
      { text: "Unlimitiert", highlight: true },
      { text: "Multilingual DE/EN/FR/IT", highlight: false },
      { text: "Rechnungs- & Order Lookup", highlight: false },
      { text: "Web Dashboard (Summaries)", highlight: false },
      { text: "Weiterleitung to Human", highlight: false },
      { text: "ERP/CRM Anbindungen", highlight: false },
      { text: "Toolintegrationen", highlight: false },
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
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Preisgestaltung
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Wählen Sie den Plan, der am besten zu Ihren Anforderungen passt.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-stretch">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative flex flex-col bg-white ${
                plan.popular
                  ? "border-4 border-purple-600 shadow-2xl md:scale-105"
                  : "border-2 border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>BELIEBT</span>
                  </span>
                </div>
              )}

              {/* Price Circle */}
              <div className="flex justify-center mb-6">
                <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center ${
                  plan.popular 
                    ? "bg-gradient-to-br from-purple-500 to-purple-700" 
                    : plan.tier === "enterprise"
                    ? "bg-gradient-to-br from-teal-500 to-teal-700"
                    : "bg-gradient-to-br from-cyan-500 to-cyan-700"
                }`}>
                  <span className="text-white text-xs font-medium">CHF</span>
                  <span className="text-white text-3xl font-bold">{plan.price}</span>
                  <span className="text-white text-xs">/Monat</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                      feature.highlight ? "text-teal-500" : "text-green-500"
                    }`} />
                    <span className="text-gray-700">
                      {feature.highlight ? (
                        <span className="font-semibold">{feature.text}</span>
                      ) : (
                        feature.text
                      )}
                      {feature.suffix && (
                        <span className="text-gray-500 text-sm ml-1">{feature.suffix}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={`/register?plan=${plan.tier}`} className="block mt-auto">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                      : plan.tier === "enterprise"
                      ? "bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white"
                      : "bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 text-white"
                  }`}
                  size="lg"
                >
                  einmalige Setup Fee*
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Setup Fee Notice */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            <span>*abhängig von der <span className="text-purple-600 font-medium">Komplexität der Integration</span> (Setup Fee: CHF 500 - 2500)</span>
          </p>
        </div>

        {/* Custom Plan CTA */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Kein Plan passt perfekt?
            </h3>
            <p className="text-gray-600 mb-6">
              Wir bieten flexible Lösungen für jede Unternehmensgrösse. Sagen Sie uns,
              was Sie brauchen – wir kümmern uns um den Rest.
            </p>
            <Link href="/register?plan=enterprise">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
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

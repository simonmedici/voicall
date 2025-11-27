"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const plans = [
  {
    name: "Starter",
    tier: "starter",
    price: "199",
    description: "Für kleine Praxen",
    popular: false,
    features: [
      "500 Minuten/Monat",
      "KI-Anrufannahme 24/7",
      "Terminverwaltung",
      "E-Mail Support",
    ],
  },
  {
    name: "Pro",
    tier: "pro",
    price: "349",
    description: "Für größere Praxen",
    popular: true,
    features: [
      "1500 Minuten/Monat",
      "Termin- & Stornomanagement",
      "Outbound-Calls",
      "Priorisierter Support",
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "499",
    description: "Für große Einrichtungen",
    popular: false,
    features: [
      "Unbegrenzte Minuten",
      "Vollständige Terminverwaltung",
      "24/7 Premium-Support",
      "Anpassbare Workflows",
    ],
  },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubscribe = async (tier: string) => {
    setLoading(tier);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Fehler beim Erstellen des Checkouts");
        setLoading(null);
        setIsRedirecting(false);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setLoading(null);
      setIsRedirecting(false);
    }
  };

  useEffect(() => {
    const savedPlan = localStorage.getItem("selectedPlan");
    if (savedPlan && ["starter", "pro", "enterprise"].includes(savedPlan)) {
      localStorage.removeItem("selectedPlan");
      setIsRedirecting(true);
      handleSubscribe(savedPlan);
    }
  }, []);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Weiterleitung zum Checkout...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Wählen Sie Ihren Plan
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Um Voicall nutzen zu können, benötigen Sie ein aktives Abonnement. 
            Wählen Sie den Plan, der am besten zu Ihrer Praxis passt.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.tier}
              className={`p-6 relative flex flex-col ${
                plan.popular
                  ? "border-2 border-blue-600 shadow-xl ring-2 ring-blue-600/20"
                  : "border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    BELIEBT
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  {plan.name}
                </h3>
                <p className="text-zinc-500 text-sm mb-3">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 ml-1">CHF/Monat</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.tier)}
                disabled={loading !== null}
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.tier ? "Laden..." : "Plan wählen"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-zinc-500 mb-4">
            Sie möchten sich zuerst abmelden?
          </p>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-zinc-600 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Stethoscope,
  UtensilsCrossed,
  ShoppingBag,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const industries = [
  {
    id: "medical",
    name: "Arztpraxen & Physiotherapie",
    icon: Stethoscope,
    color: "blue",
    description: "Entlasten Sie Ihr Praxisteam und verbessern Sie die Patientenerfahrung",
    useCases: [
      { icon: Calendar, text: "Terminvereinbarung & Änderungen" },
      { icon: Phone, text: "Allgemeine Praxisanfragen" },
      { icon: Clock, text: "Öffnungszeiten & Notfallinformationen" },
      { icon: MessageSquare, text: "Rezeptanfragen & Überweisungen" },
    ],
    stats: {
      metric: "-40%",
      label: "weniger No-Shows",
    },
    testimonial: {
      quote: "Unsere Patienten erreichen uns jetzt rund um die Uhr. Das Praxisteam kann sich auf die Behandlung konzentrieren.",
      author: "Dr. med. Sarah Müller",
      role: "Hausärztin, Zürich",
    },
  },
  {
    id: "dental",
    name: "Zahnarztpraxen",
    icon: Stethoscope,
    color: "cyan",
    description: "Notfall-Triage und Terminmanagement für Ihre Zahnarztpraxis",
    useCases: [
      { icon: Phone, text: "Notfall-Triage & Schmerzanfragen" },
      { icon: Calendar, text: "Kontrolltermine buchen" },
      { icon: MessageSquare, text: "Versicherungsanfragen beantworten" },
      { icon: Clock, text: "Öffnungszeiten & Anfahrt" },
    ],
    stats: {
      metric: "24/7",
      label: "Notfall-Erreichbarkeit",
    },
    testimonial: {
      quote: "Besonders bei Zahnschmerz-Notfällen am Wochenende ist Voicall Gold wert. Die KI filtert echte Notfälle zuverlässig.",
      author: "Dr. Thomas Weber",
      role: "Zahnarzt, Basel",
    },
  },
  {
    id: "restaurant",
    name: "Restaurants & Gastronomie",
    icon: UtensilsCrossed,
    color: "orange",
    description: "Nie wieder eine Reservierung verpassen - auch in Stosszeiten",
    useCases: [
      { icon: Calendar, text: "Tischreservierungen annehmen" },
      { icon: MessageSquare, text: "Speisekarten-Anfragen" },
      { icon: Clock, text: "Öffnungszeiten & Events" },
      { icon: Phone, text: "Takeaway-Bestellungen" },
    ],
    stats: {
      metric: "+30%",
      label: "mehr Reservierungen",
    },
    testimonial: {
      quote: "In der Küche können wir nicht ans Telefon. Voicall nimmt jede Reservierung an - auch während dem Rush.",
      author: "Marco Rossi",
      role: "Restaurant Alpenblick, Bern",
    },
  },
  {
    id: "ecommerce",
    name: "E-Commerce & Online-Shops",
    icon: ShoppingBag,
    color: "purple",
    description: "Kundenservice rund um die Uhr für Ihren Online-Shop",
    useCases: [
      { icon: MessageSquare, text: "Bestellstatus & Tracking" },
      { icon: Phone, text: "Produktanfragen beantworten" },
      { icon: Calendar, text: "Retouren & Reklamationen" },
      { icon: Clock, text: "Lieferzeiten & Verfügbarkeit" },
    ],
    stats: {
      metric: "-60%",
      label: "Support-Tickets",
    },
    testimonial: {
      quote: "Unsere Kunden erhalten sofort Antworten zu ihren Bestellungen. Die Zufriedenheit ist messbar gestiegen.",
      author: "Lisa Schneider",
      role: "CEO, SwissStyle.ch",
    },
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "bg-blue-100 text-blue-600",
    badge: "bg-blue-900 text-white",
    stat: "text-blue-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    icon: "bg-cyan-100 text-cyan-600",
    badge: "bg-cyan-700 text-white",
    stat: "text-cyan-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "bg-orange-100 text-orange-600",
    badge: "bg-orange-600 text-white",
    stat: "text-orange-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "bg-purple-100 text-purple-600",
    badge: "bg-purple-600 text-white",
    stat: "text-purple-600",
  },
};

export function Industries() {
  const [activeTab, setActiveTab] = useState("medical");

  const activeIndustry = industries.find((i) => i.id === activeTab)!;
  const colors = colorClasses[activeIndustry.color as keyof typeof colorClasses];
  const Icon = activeIndustry.icon;

  return (
    <section id="industries" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Voicall für{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              Ihre Branche
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Massgeschneiderte Lösungen für jeden Anwendungsfall - nur eingehende Anrufe, keine Outbound-Calls.
          </p>
        </div>

        {/* Industry Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {industries.map((industry) => {
            const TabIcon = industry.icon;
            const isActive = activeTab === industry.id;
            return (
              <button
                key={industry.id}
                onClick={() => setActiveTab(industry.id)}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? `${colorClasses[industry.color as keyof typeof colorClasses].badge} shadow-lg`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <TabIcon className="h-5 w-5" />
                <span>{industry.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Industry Content */}
        <div className={`rounded-3xl ${colors.bg} ${colors.border} border-2 p-8 md:p-12`}>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Use Cases */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${colors.icon}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{activeIndustry.name}</h3>
                  <p className="text-gray-600">{activeIndustry.description}</p>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-4">Inbound Use Cases:</h4>
              <div className="space-y-4">
                {activeIndustry.useCases.map((useCase, index) => {
                  const UseCaseIcon = useCase.icon;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
                        <UseCaseIcon className="h-5 w-5" />
                      </div>
                      <span className="text-gray-800 font-medium">{useCase.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-8 flex items-center gap-4">
                <div className={`text-4xl font-bold ${colors.stat}`}>
                  {activeIndustry.stats.metric}
                </div>
                <div className="text-gray-600">
                  {activeIndustry.stats.label}
                </div>
              </div>
            </div>

            {/* Right: Testimonial */}
            <div className="flex flex-col justify-center">
              <Card className="p-8 bg-white shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className={`h-5 w-5 ${colors.stat}`} />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-800 mb-6 italic">
                  "{activeIndustry.testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colors.icon}`}>
                    <span className="text-lg font-bold">
                      {activeIndustry.testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{activeIndustry.testimonial.author}</p>
                    <p className="text-sm text-gray-600">{activeIndustry.testimonial.role}</p>
                  </div>
                </div>
              </Card>

              {/* Success Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${colors.stat}`} />
                  <p className="text-2xl font-bold text-gray-900">24/7</p>
                  <p className="text-sm text-gray-600">Erreichbar</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <Phone className={`h-6 w-6 mx-auto mb-2 ${colors.stat}`} />
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-sm text-gray-600">Anrufe beantwortet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

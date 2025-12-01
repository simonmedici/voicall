"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight, CheckCircle, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(true);

  const handleSkipOnboarding = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Willkommen bei Voicall!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ihr Abonnement ist aktiv. Buchen Sie jetzt Ihren persönlichen Onboarding-Termin, 
            damit wir Ihren KI-Assistenten optimal auf Ihr Unternehmen abstimmen können.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Benefits */}
          <Card className="p-6 bg-blue-50 border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Im Onboarding besprechen wir:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Ihre spezifischen Anforderungen</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Branchenspezifische Anpassungen</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Integration mit bestehenden Systemen</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Gesprächsführung & Tonalität</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Zeitplan & nächste Schritte</span>
              </li>
            </ul>
          </Card>

          {/* Calendar Embed */}
          <Card className="lg:col-span-2 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Termin auswählen
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>30 Minuten</span>
              </div>
            </div>
            
            {showCalendar && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src="https://cal.com/simon-medici/onboarding?embed=true&theme=light"
                  width="100%"
                  height="450"
                  frameBorder="0"
                  className="w-full"
                  allow="payment"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <div className="inline-block bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-600 mb-4">
              Haben Sie bereits ein Onboarding absolviert oder möchten Sie direkt starten?
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkipOnboarding}
              className="gap-2"
            >
              Onboarding überspringen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Sie können den Onboarding-Termin auch später über das Dashboard buchen.
        </p>
      </div>
    </div>
  );
}

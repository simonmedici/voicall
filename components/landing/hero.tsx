"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight, Star, ShieldCheck, Languages } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-950/10 text-blue-900 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Phone className="h-4 w-4" />
            <span>KI-Telefonassistent für Schweizer Arztpraxen</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Die einzige Praxis, die{" "}
            <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              immer ans Telefon geht
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed">
            Unser KI-Telefonassistent nimmt Anrufe 24/7 entgegen, vereinbart
            Termine automatisch und versteht Schweizerdeutsch perfekt.
          </p>

          {/* Trust Badges - USPs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>Zero PII-Retention - Keine Datenspeicherung</span>
            </div>
            <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="text-lg">🇨🇭</span>
              <Languages className="h-5 w-5 text-red-600" />
              <span>Versteht Schweizerdeutsch perfekt</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-950 hover:to-purple-700 text-lg px-8 py-6"
              >
                Jetzt kostenlos testen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
              >
                Mehr erfahren
              </Button>
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">500+</span>{" "}
              Schweizer Arztpraxen vertrauen Voicall
            </p>
          </div>
        </div>

        {/* Dashboard Demo Image */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-2xl border-8 border-gray-200 shadow-2xl overflow-hidden">
            <Image
              src="/images/dashboard-demo.png"
              alt="Voicall Dashboard - KI-Telefonassistent für Arztpraxen"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
            <div className="absolute top-4 left-4">
              <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 text-sm font-medium">
                  Live Demo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

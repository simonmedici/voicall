"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  Languages,
  Stethoscope,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";

const industries = [
  {
    name: "Arztpraxen",
    headline: "immer ans Telefon geht",
    icon: Stethoscope,
  },
  {
    name: "Restaurants",
    headline: "nie eine Reservierung verpasst",
    icon: UtensilsCrossed,
  },
  {
    name: "E-Commerce",
    headline: "rund um die Uhr Support bietet",
    icon: ShoppingBag,
  },
  {
    name: "Physiotherapien",
    headline: "jeden Terminwunsch erfüllt",
    icon: Stethoscope,
  },
  {
    name: "Zahnarztpraxen",
    headline: "auch Notfälle sofort betreut",
    icon: Stethoscope,
  },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentIndustry = industries[currentIndex];
  const fullText = currentIndustry.headline;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isTyping && !isDeleting) {
      if (displayedText.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(fullText.slice(0, displayedText.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
          setIsTyping(false);
        }, 2500);
      }
    } else if (isDeleting) {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
      } else {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % industries.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isTyping, isDeleting, fullText]);

  const handleIndustryClick = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setDisplayedText("");
      setCurrentIndex(index);
      setIsTyping(true);
      setIsDeleting(false);
    },
    [currentIndex]
  );

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-950/10 text-blue-900 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Phone className="h-4 w-4" />
            <span>KI-Telefonassistent für Schweizer Unternehmen</span>
          </div>

          {/* Headline with Typewriter Effect - fixed height for 2 lines */}
          <div className="min-h-[280px] sm:min-h-[320px] lg:min-h-[350px] flex items-start justify-center mb-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Das einzige Unternehmen, das{" "}
              <span className="bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
                {displayedText}
                <span className="animate-pulse text-purple-600">|</span>
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
            Unser KI-Telefonassistent nimmt Anrufe 24/7 entgegen, beantwortet
            Fragen und versteht Schweizerdeutsch perfekt.
          </p>

          {/* Industry Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <button
                  key={industry.name}
                  onClick={() => handleIndustryClick(index)}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentIndex === index
                      ? "bg-blue-900 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{industry.name}</span>
                </button>
              );
            })}
          </div>

          {/* Trust Badges - USPs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span>DSGVO/DSG-konform</span>
            </div>
            <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="text-lg">🇨🇭</span>
              <Languages className="h-5 w-5 text-red-600" />
              <span>Versteht Schweizerdeutsch</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-950 hover:to-purple-700 text-lg px-8 py-6"
              >
                Jetzt starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="#industries"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("industries")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
              >
                Für meine Branche
              </Button>
            </a>
          </div>

          {/* Trust Badge */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white border-2 border-green-200 rounded-2xl px-8 py-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  DSGVO/DSG Garantie
                </p>
                <p className="text-sm text-gray-600">
                  Für alle Branchen zertifiziert
                </p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🇨🇭</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  Swiss Made Quality
                </p>
                <p className="text-sm text-gray-600">
                  Entwickelt für Schweizer Unternehmen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

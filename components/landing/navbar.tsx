"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
              Voicall
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Preise
            </a>
            <a
              href="#faq"
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              FAQ
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-950 hover:to-purple-700">
                Jetzt starten
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a
              href="#features"
              className="block text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="block text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Preise
            </a>
            <a
              href="#faq"
              className="block text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              FAQ
            </a>
            <div className="pt-4 space-y-2">
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  Anmelden
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-900 to-purple-600">
                  Jetzt starten
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

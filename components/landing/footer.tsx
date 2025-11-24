import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-purple-400 bg-clip-text text-transparent">
                Voicall
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              Modernisieren Sie Ihre Praxiskommunikation mit unserer
              KI-Telefonlösung. 24/7 erreichbar, DSGVO-konform, spezialisiert
              auf Schweizer Arztpraxen.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:contact@voicall.ch"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>contact@voicall.ch</span>
              </a>
              <a
                href="tel:+41445005000"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span>+41 44 500 50 00</span>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Produkt</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Preise
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Kostenlos testen
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Unternehmen
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Über uns
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Karriere
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@voicall.ch"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Voicall. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Datenschutz
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                AGB
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Impressum
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

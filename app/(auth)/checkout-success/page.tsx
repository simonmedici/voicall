"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch("/api/subscription/status");
        const data = await res.json();

        if (data.hasActiveSubscription) {
          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else if (attempts < 10) {
          setAttempts((prev) => prev + 1);
          setTimeout(checkSubscription, 2000);
        } else {
          setStatus("error");
        }
      } catch {
        if (attempts < 10) {
          setAttempts((prev) => prev + 1);
          setTimeout(checkSubscription, 2000);
        } else {
          setStatus("error");
        }
      }
    };

    checkSubscription();
  }, [attempts, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Zahlung wird verarbeitet...
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Bitte warten Sie, während wir Ihre Zahlung bestätigen.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Zahlung erfolgreich!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Sie werden zum Dashboard weitergeleitet...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Zahlung wird noch verarbeitet
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Die Verarbeitung dauert etwas länger. Bitte versuchen Sie in einigen Minuten, 
              sich anzumelden.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Zur Anmeldung
            </button>
          </>
        )}
      </div>
    </div>
  );
}

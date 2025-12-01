"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Keine Checkout-Session gefunden.");
      return;
    }

    const syncSubscription = async () => {
      try {
        const res = await fetch("/api/stripe/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setTimeout(() => {
            router.push("/onboarding");
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Synchronisierung fehlgeschlagen.");
        }
      } catch (err) {
        console.error("Sync error:", err);
        setStatus("error");
        setErrorMessage("Ein Fehler ist aufgetreten.");
      }
    };

    syncSubscription();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center max-w-md px-4">
        {status === "syncing" && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Zahlung wird verarbeitet...
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Bitte warten Sie, während wir Ihr Abonnement aktivieren.
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
              Ihr Abonnement ist jetzt aktiv. Sie werden zum Onboarding weitergeleitet...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Fehler bei der Verarbeitung
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {errorMessage}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => router.push("/login")}
                className="w-full px-6 py-2 bg-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Zur Anmeldung
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export function StripePortalButton() {
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const data = await response.json();

      // Redirect to Stripe Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Error opening portal:", error);
      alert(
        "Fehler beim Öffnen des Stripe Portals. Bitte versuchen Sie es später erneut."
      );
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleOpenPortal} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Lädt...
        </>
      ) : (
        <>
          <ExternalLink className="mr-2 h-4 w-4" />
          Stripe Portal öffnen
        </>
      )}
    </Button>
  );
}

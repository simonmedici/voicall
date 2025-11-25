"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Script from "next/script";

export default function TestAgentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get("id");
  const agentName = searchParams.get("name");
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      router.push("/dashboard/agents");
    }
  }, [agentId, router]);

  if (!agentId) {
    return null;
  }

  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ ElevenLabs widget loaded");
          setWidgetLoaded(true);
        }}
        onError={() => {
          console.error("❌ Failed to load ElevenLabs widget");
          setError("Widget konnte nicht geladen werden.");
        }}
      />

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/agents")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Meine Agents
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Agent testen: {agentName || "Unbekannt"}
          </h1>
          <p className="text-gray-600 mt-2">
            Sprechen Sie direkt mit Ihrem Agent im Browser
          </p>
        </div>

        {!widgetLoaded && (
          <Alert className="mb-6">
            <AlertDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Widget wird geladen...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6">
          <AlertDescription>
            <strong>💡 Hinweis:</strong> Der Agent wird automatisch seine
            Begrüßungsnachricht sprechen, sobald Sie das Widget öffnen (unten
            rechts). Erlauben Sie Mikrofon-Zugriff wenn Ihr Browser danach
            fragt.
          </AlertDescription>
        </Alert>

        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-12 border-2 border-dashed border-blue-300">
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              Widget ist bereit!
            </p>
            <p className="text-gray-600 mb-4">
              Klicken Sie auf das Chat-Widget unten rechts, um die Konversation
              zu starten.
            </p>
            <p className="text-sm text-gray-500 bg-white/50 rounded p-4 inline-block">
              <strong>
                Der Agent wird automatisch mit seiner Begrüßung starten!
              </strong>
              <br />
              Falls nicht, prüfen Sie ob die &quot;First Message&quot; im Agent
              konfiguriert ist.
            </p>
          </div>
        </div>

        {/* ElevenLabs Widget - Agent-initiated mode */}
        {widgetLoaded && (
          <div
            dangerouslySetInnerHTML={{
              __html: `<elevenlabs-convai agent-id="${agentId}" client-initiated="false"></elevenlabs-convai>`,
            }}
          />
        )}
      </div>
    </>
  );
}

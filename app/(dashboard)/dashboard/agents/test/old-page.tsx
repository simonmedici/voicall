"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function TestAgentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get("id"); // ElevenLabs Agent ID
  const dbId = searchParams.get("dbId"); // Database ID
  const agentName = searchParams.get("name");
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<{
    greetingMessage?: string;
    elevenLabsAgentId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load agent data to get first message
  useEffect(() => {
    if (!agentId || !dbId) {
      router.push("/dashboard/agents");
      return;
    }

    const loadAgentData = async () => {
      try {
        const response = await fetch(`/api/agent?agentId=${dbId}`);
        if (!response.ok) {
          throw new Error("Failed to load agent data");
        }
        const data = await response.json();
        console.log("🔍 Loaded agent data:", data);
        console.log("📝 Greeting Message:", data.greetingMessage);
        console.log("🎯 ElevenLabs Agent ID:", agentId);
        setAgentData(data);
      } catch (err) {
        console.error("Failed to load agent:", err);
        setError("Agent konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, [agentId, dbId, router]);

  // Load ElevenLabs widget script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="convai-widget-embed"]')) {
      console.log("✅ Widget script already loaded");
      setWidgetLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    script.type = "text/javascript";

    script.onload = () => {
      console.log("✅ ElevenLabs widget script loaded");
      setWidgetLoaded(true);
    };

    script.onerror = () => {
      console.error("❌ Failed to load ElevenLabs widget script");
      setError("Widget-Script konnte nicht geladen werden.");
    };

    document.body.appendChild(script);
    console.log("📦 Loading widget script...");

    return () => {
      // Cleanup - remove script when component unmounts
      const existingScript = document.querySelector(
        'script[src*="convai-widget-embed"]'
      );
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {(!agentId || loading) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Lädt Agent-Daten...</span>
          </div>
        ) : (
          <>
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
                Begrüßungsnachricht sprechen, sobald Sie das Widget öffnen
                (unten rechts). Erlauben Sie Mikrofon-Zugriff wenn Ihr Browser
                danach fragt.
              </AlertDescription>
            </Alert>

            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-12 border-2 border-dashed border-blue-300">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  Widget ist bereit!
                </p>
                <p className="text-gray-600 mb-4">
                  Klicken Sie auf das Chat-Widget unten rechts, um die
                  Konversation zu starten.
                </p>
                <p className="text-sm text-gray-500 bg-white/50 rounded p-4 inline-block">
                  <strong>
                    Der Agent wird automatisch mit seiner Begrüßung starten!
                  </strong>
                  <br />
                  Falls nicht, prüfen Sie ob die &quot;First Message&quot; im
                  Agent konfiguriert ist.
                </p>
              </div>
            </div>

            {/* ElevenLabs Widget - Pass first message as override */}
            {widgetLoaded && agentId && (
              <div
                dangerouslySetInnerHTML={{
                  __html: `<elevenlabs-convai agent-id="${agentId}"${
                    agentData?.greetingMessage
                      ? ` override-first-message="${agentData.greetingMessage.replace(
                          /"/g,
                          "&quot;"
                        )}"`
                      : ""
                  }></elevenlabs-convai>`,
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

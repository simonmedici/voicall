"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Info } from "lucide-react";

function TestAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const elevenLabsAgentId = searchParams.get("id");
  const dbId = searchParams.get("dbId");
  const agentName = searchParams.get("name");

  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elevenLabsAgentId || !dbId) {
      router.push("/dashboard/agents");
      return;
    }
  }, [elevenLabsAgentId, dbId, router]);

  useEffect(() => {
    if (!elevenLabsAgentId) return;

    const existingScript = document.querySelector('script[src*="convai-widget"]');
    if (existingScript) {
      console.log("✅ Widget script already loaded");
      setTimeout(() => setWidgetLoaded(true), 0);
      return;
    }

    console.log("📦 Loading ElevenLabs widget script...");

    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "module";

    script.onload = () => {
      console.log("✅ Widget script loaded successfully");
      setWidgetLoaded(true);
    };

    script.onerror = () => {
      console.error("❌ Failed to load widget script");
      setError("Widget-Script konnte nicht geladen werden");
    };

    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector(
        'script[src*="convai-widget"]'
      );
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, [elevenLabsAgentId]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agent testen: {agentName}</CardTitle>
          <CardDescription>
            Testen Sie Ihren Agent mit dem ElevenLabs Conversational AI Widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Hinweis:</strong> Der Agent muss als öffentlich (Public)
              konfiguriert sein, damit das Widget funktioniert. Klicken Sie auf
              das Widget-Symbol unten rechts, um die Konversation zu starten.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!widgetLoaded && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3">Widget wird geladen...</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Agent Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Agent ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {elevenLabsAgentId}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Database ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {dbId}
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test-Anleitung</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Klicken Sie auf das Widget-Symbol unten rechts</li>
                <li>Erlauben Sie den Mikrofonzugriff</li>
                <li>Der Agent sollte automatisch seine erste Nachricht sprechen</li>
                <li>Sprechen Sie mit dem Agent, um seine Funktionen zu testen</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {widgetLoaded && elevenLabsAgentId && (
        <div
          dangerouslySetInnerHTML={{
            __html: `<elevenlabs-convai agent-id="${elevenLabsAgentId}"></elevenlabs-convai>`,
          }}
        />
      )}
    </div>
  );
}

export default function TestAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TestAgentContent />
    </Suspense>
  );
}

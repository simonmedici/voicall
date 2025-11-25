"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Info, CheckCircle } from "lucide-react";

const ElevenLabsWidget = dynamic(
  () => import("@/components/ElevenLabsWidget"),
  { ssr: false }
);

function TestAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const elevenLabsAgentId = searchParams.get("id");
  const dbId = searchParams.get("dbId");
  const agentName = searchParams.get("name");

  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (!elevenLabsAgentId || !dbId) {
      router.push("/dashboard/agents");
      return;
    }
    setWidgetReady(true);
  }, [elevenLabsAgentId, dbId, router]);

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
              <strong>Hinweis:</strong> Klicken Sie auf das Widget-Symbol unten
              rechts, um die Konversation zu starten. Erlauben Sie den
              Mikrofonzugriff wenn angefragt.
            </AlertDescription>
          </Alert>

          {widgetReady && (
            <Alert className="mb-6 border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Widget ist bereit! Klicken Sie auf das Symbol unten rechts.
              </AlertDescription>
            </Alert>
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

      {widgetReady && elevenLabsAgentId && (
        <ElevenLabsWidget agentId={elevenLabsAgentId} />
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

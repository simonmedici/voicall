"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mic, MessageSquare } from "lucide-react";

interface Voice {
  voiceId: string;
  name: string;
  category: string;
  labels?: Record<string, string>;
}

interface Agent {
  id: string;
  name: string;
  voiceId: string;
  systemPrompt: string;
  firstMessage: string;
  language: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  elevenLabsAgentId: string;
}

function EditAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");

  const [voices, setVoices] = useState<Voice[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    voiceId: "",
    firstMessage: "",
  });

  useEffect(() => {
    if (!agentId) {
      router.push("/dashboard/agents");
      return;
    }

    async function load() {
      try {
        setLoading(true);

        const agentRes = await fetch(`/api/agent?agentId=${agentId}`);
        if (!agentRes.ok) throw new Error("Failed to load agent");
        const agentData = await agentRes.json();
        setAgent(agentData);

        setFormData({
          voiceId: agentData.voiceId || "",
          firstMessage: agentData.firstMessage || "",
        });

        const voicesRes = await fetch("/api/voices/list");
        if (!voicesRes.ok) throw new Error("Failed to load voices");
        const voicesData = await voicesRes.json();
        setVoices(voicesData.voices || []);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [agentId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!agent) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: formData.voiceId,
          firstMessage: formData.firstMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/agents");
      }, 1500);
    } catch (err) {
      console.error("Failed to update agent:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Aktualisieren des Agents"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Alert variant="destructive">
          <AlertDescription>Agent nicht gefunden</AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push("/dashboard/agents")}
          className="mt-4"
        >
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  const selectedVoice = voices.find((v) => v.voiceId === formData.voiceId);

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{agent.name}</CardTitle>
          <CardDescription>
            Passen Sie Stimme und Begrüssung Ihres Telefonagenten an
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Änderungen erfolgreich gespeichert!
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <Label htmlFor="voice" className="text-lg font-medium">
                  Stimme
                </Label>
              </div>
              <Select
                value={formData.voiceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, voiceId: value })
                }
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Wählen Sie eine Stimme" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {voices.map((voice) => {
                    const language =
                      voice.labels?.language || voice.labels?.accent || "";
                    const useCase =
                      voice.labels?.use_case ||
                      voice.labels?.["use case"] ||
                      "";
                    const description = voice.labels?.description || "";

                    return (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{voice.name}</span>
                          {language && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {language}
                            </span>
                          )}
                          {useCase && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {useCase}
                            </span>
                          )}
                          {description && (
                            <span className="text-xs text-muted-foreground">
                              {description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedVoice && (
                <p className="text-sm text-muted-foreground">
                  Aktuell: <strong>{selectedVoice.name}</strong>
                  {selectedVoice.labels?.language &&
                    ` (${selectedVoice.labels.language})`}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <Label htmlFor="firstMessage" className="text-lg font-medium">
                  Erste Nachricht (Begrüssung)
                </Label>
              </div>
              <Textarea
                id="firstMessage"
                value={formData.firstMessage}
                onChange={(e) =>
                  setFormData({ ...formData, firstMessage: e.target.value })
                }
                placeholder="z.B. Grüezi! Praxis Dr. Müller, wie kann ich Ihnen helfen?"
                rows={3}
                className="text-base"
                required
              />
              <p className="text-sm text-muted-foreground">
                Diese Nachricht hört der Anrufer als Erstes, wenn er anruft
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  "Änderungen speichern"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <EditAgentContent />
    </Suspense>
  );
}

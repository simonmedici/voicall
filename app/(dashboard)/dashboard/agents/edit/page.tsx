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
import { Input } from "@/components/ui/input";
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
import { Loader2, ArrowLeft } from "lucide-react";

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

  const [formData, setFormData] = useState({
    name: "",
    voiceId: "",
    systemPrompt: "",
    firstMessage: "",
    language: "de",
    llmModel: "gpt-4o",
    temperature: 1.0,
    maxTokens: -1,
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
          name: agentData.name || "",
          voiceId: agentData.voiceId || "",
          systemPrompt: agentData.systemPrompt || "",
          firstMessage: agentData.firstMessage || "",
          language: agentData.language || "de",
          llmModel: agentData.llmModel || "gpt-4o",
          temperature: agentData.temperature ?? 1.0,
          maxTokens: agentData.maxTokens ?? -1,
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

    if (!agent) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      console.log("✅ Agent updated");
      router.push("/dashboard/agents");
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
        <Button onClick={() => router.push("/dashboard/agents")} className="mt-4">
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Agent bearbeiten</CardTitle>
          <CardDescription>
            Aktualisieren Sie die Konfiguration Ihres Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Agent Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">
                Stimme <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.voiceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, voiceId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Stimme" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {voices.map((voice) => {
                    const language = voice.labels?.language || voice.labels?.accent || "";
                    const useCase = voice.labels?.use_case || voice.labels?.["use case"] || "";
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
              <p className="text-sm text-muted-foreground">
                Wählen Sie eine Stimme mit passender Sprache und Stil
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                Sprache <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstMessage">
                Erste Nachricht <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstMessage"
                value={formData.firstMessage}
                onChange={(e) =>
                  setFormData({ ...formData, firstMessage: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">
                System Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="llmModel">LLM Modell</Label>
              <Select
                value={formData.llmModel}
                onValueChange={(value) =>
                  setFormData({ ...formData, llmModel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">
                    Claude 3.5 Sonnet
                  </SelectItem>
                  <SelectItem value="gemini-2.0-flash-exp">
                    Gemini 2.0 Flash
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (0-2)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
              />
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

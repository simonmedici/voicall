"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check } from "lucide-react";

interface Voice {
  voiceId: string;
  name: string;
  category: string;
  previewUrl?: string;
}

interface Agent {
  id: string;
  name: string;
  voiceId: string;
  voiceName: string;
  systemPrompt: string;
  greetingMessage: string;
  language: string;
  additionalLanguages?: string[];
  llmModel: string;
  llmTemperature: number;
  maxTokens: number;
  turnTimeout: number;
  turnEagerness: string;
  enableInterruptions: boolean;
  disableFirstMessageInterruptions: boolean;
  maxDuration: number;
  enableRag: boolean;
  elevenLabsAgentId: string;
}

export default function EditAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    language: "de",
    additionalLanguages: [] as string[],
    voiceId: "",
    voiceName: "",
    systemPrompt: "",
    greetingMessage: "",
    disableFirstMessageInterruptions: false,
    llmModel: "gpt-4o-mini",
    llmTemperature: 0.7,
    maxTokens: -1,
    turnTimeout: 7,
    turnEagerness: "normal" as "eager" | "normal" | "patient",
    enableInterruptions: true,
    maxDuration: 600,
    enableRag: false,
  });

  useEffect(() => {
    if (!agentId) {
      router.push("/dashboard/agents");
      return;
    }
    fetchAgent();
    fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      setLoadingAgent(true);
      const response = await fetch(`/api/agent?agentId=${agentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agent");
      }

      const agent: Agent = await response.json();

      setFormData({
        name: agent.name,
        language: agent.language,
        additionalLanguages: agent.additionalLanguages || [],
        voiceId: agent.voiceId,
        voiceName: agent.voiceName,
        systemPrompt: agent.systemPrompt,
        greetingMessage: agent.greetingMessage,
        disableFirstMessageInterruptions:
          agent.disableFirstMessageInterruptions,
        llmModel: agent.llmModel,
        llmTemperature: agent.llmTemperature,
        maxTokens: agent.maxTokens,
        turnTimeout: agent.turnTimeout,
        turnEagerness: agent.turnEagerness as "eager" | "normal" | "patient",
        enableInterruptions: agent.enableInterruptions,
        maxDuration: agent.maxDuration,
        enableRag: agent.enableRag,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoadingAgent(false);
    }
  };

  const fetchVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await fetch("/api/voices/list");

      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }

      const data = await response.json();
      setVoices(data.voices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load voices");
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update via save endpoint (we need to create this)
      const response = await fetch("/api/agent/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update agent");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/agents");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Aktualisieren des Agents"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const languages = [
    { code: "de", name: "Deutsch" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "it", name: "Italiano" },
    { code: "es", name: "Español" },
  ];

  const llmModels = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Empfohlen)" },
    { id: "gpt-4o", name: "GPT-4o (Leistungsstark)" },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  ];

  if (loadingAgent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt Agent...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Agent erfolgreich aktualisiert!
              </h3>
              <p className="text-gray-600">Sie werden weitergeleitet...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/agents")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück zu Meine Agents
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agent bearbeiten</h1>
        <p className="text-gray-600 mt-2">
          Passen Sie die Konfiguration Ihres Agents an
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Grundinformationen</CardTitle>
            <CardDescription>Name und Sprache Ihres Agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Agent-Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="z.B. Praxis-Assistent Nina"
                required
              />
            </div>

            <div>
              <Label htmlFor="language">Hauptsprache *</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => updateFormData("language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Voice Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Stimme</CardTitle>
            <CardDescription>
              Wählen Sie die Stimme für Ihren Agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVoices ? (
              <p className="text-gray-500">Lädt Stimmen...</p>
            ) : (
              <div>
                <Label htmlFor="voice">Stimme auswählen *</Label>
                <Select
                  value={formData.voiceId}
                  onValueChange={(value) => {
                    const voice = voices.find((v) => v.voiceId === value);
                    updateFormData("voiceId", value);
                    updateFormData("voiceName", voice?.name || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stimme auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.slice(0, 50).map((voice) => (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                        {voice.name}
                        {voice.category && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {voice.category}
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Verhalten & Persönlichkeit</CardTitle>
            <CardDescription>
              Definieren Sie wie Ihr Agent kommuniziert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="greetingMessage">Erste Nachricht</Label>
              <Textarea
                id="greetingMessage"
                value={formData.greetingMessage}
                onChange={(e) =>
                  updateFormData("greetingMessage", e.target.value)
                }
                placeholder="Die erste Nachricht, die der Agent sagt..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">System-Prompt *</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => updateFormData("systemPrompt", e.target.value)}
                placeholder="Beschreiben Sie die Persönlichkeit und Aufgaben des Agents..."
                rows={12}
                required
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Erweiterte Einstellungen</CardTitle>
            <CardDescription>
              LLM-Modell und Konversations-Parameter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="llmModel">LLM-Modell</Label>
              <Select
                value={formData.llmModel}
                onValueChange={(value) => updateFormData("llmModel", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="llmTemperature">
                Temperatur: {formData.llmTemperature}
              </Label>
              <input
                type="range"
                id="llmTemperature"
                min="0"
                max="1"
                step="0.1"
                value={formData.llmTemperature}
                onChange={(e) =>
                  updateFormData("llmTemperature", parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Deterministisch</span>
                <span>Kreativ</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turnTimeout">Turn Timeout (Sek.)</Label>
                <Input
                  id="turnTimeout"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.turnTimeout}
                  onChange={(e) =>
                    updateFormData("turnTimeout", parseInt(e.target.value))
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxDuration">Max. Dauer (Sek.)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  min="60"
                  max="3600"
                  value={formData.maxDuration}
                  onChange={(e) =>
                    updateFormData("maxDuration", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="turnEagerness">Antwort-Verhalten</Label>
              <Select
                value={formData.turnEagerness}
                onValueChange={(value) =>
                  updateFormData("turnEagerness", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eager">
                    Eager (Schnelle Antworten)
                  </SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="patient">
                    Patient (Wartet länger)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableInterruptions"
                checked={formData.enableInterruptions}
                onChange={(e) =>
                  updateFormData("enableInterruptions", e.target.checked)
                }
                className="rounded"
              />
              <Label htmlFor="enableInterruptions" className="cursor-pointer">
                Unterbrechungen erlauben
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/agents")}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}

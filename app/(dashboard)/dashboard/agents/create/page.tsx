"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

export default function CreateAgentPage() {
  const router = useRouter();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - Based on ElevenLabs required fields
  const [formData, setFormData] = useState({
    name: "",
    voiceId: "",
    systemPrompt: "",
    firstMessage: "", // REQUIRED by ElevenLabs!
    language: "de",
    llmModel: "gpt-4o",
    temperature: 1.0,
    maxTokens: -1,
  });

  useEffect(() => {
    loadVoices();
  }, []);

  async function loadVoices() {
    try {
      const response = await fetch("/api/voices/list");
      if (!response.ok) throw new Error("Failed to load voices");
      const data = await response.json();
      setVoices(data.voices || []);
    } catch (err) {
      console.error("Failed to load voices:", err);
      setError("Fehler beim Laden der Stimmen");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (
      !formData.name ||
      !formData.voiceId ||
      !formData.systemPrompt ||
      !formData.firstMessage ||
      !formData.language
    ) {
      setError("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      const result = await response.json();
      console.log("✅ Agent created:", result);

      // Redirect to agents list
      router.push("/dashboard/agents");
    } catch (err) {
      console.error("Failed to create agent:", err);
      setError(
        err instanceof Error ? err.message : "Fehler beim Erstellen des Agents"
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Agent erstellen</CardTitle>
          <CardDescription>
            Erstellen Sie einen neuen KI-Telefonagenten basierend auf der
            ElevenLabs Conversational AI Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name - REQUIRED */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Agent Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="z.B. Praxis-Assistent"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Voice Selection - REQUIRED */}
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
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceId} value={voice.voiceId}>
                      {voice.name} ({voice.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language - REQUIRED */}
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

            {/* First Message - REQUIRED by ElevenLabs! */}
            <div className="space-y-2">
              <Label htmlFor="firstMessage">
                Erste Nachricht (First Message){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstMessage"
                placeholder="z.B. Grüezi! Wie kann ich Ihnen helfen?"
                value={formData.firstMessage}
                onChange={(e) =>
                  setFormData({ ...formData, firstMessage: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Diese Nachricht wird automatisch gesprochen, wenn ein Anruf
                verbunden wird
              </p>
            </div>

            {/* System Prompt - REQUIRED */}
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">
                System Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="systemPrompt"
                placeholder="z.B. Du bist ein freundlicher Telefonassistent für eine Arztpraxis..."
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                rows={6}
                required
              />
              <p className="text-sm text-muted-foreground">
                Definiert das Verhalten und die Persönlichkeit des Agents
              </p>
            </div>

            {/* LLM Model */}
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

            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature (0-2, Standard: 1.0)
              </Label>
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
              <p className="text-sm text-muted-foreground">
                Höhere Werte = kreativer, Niedrigere Werte = fokussierter
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={creating}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={creating} className="flex-1">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agent wird erstellt...
                  </>
                ) : (
                  "Agent erstellen"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface AgentConfig {
  greetingMessage: string | null;
  voiceId: string | null;
  voiceName: string | null;
  enabledLanguages: string[];
  ragDocuments: Array<{ name: string; url: string; uploadedAt: string }> | null;
  phoneNumber: string | null;
  isActive: boolean;
  systemPrompt?: string | null;
  language?: string | null;
  elevenLabsAgentId?: string | null;
}

interface Voice {
  voiceId: string;
  name: string;
  previewUrl?: string;
  category?: string;
  labels?: Record<string, string>;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingVoices, setLoadingVoices] = useState(false);

  const [greetingMessage, setGreetingMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testingCall, setTestingCall] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchVoices();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agent-config");
      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
        setGreetingMessage(data.config.greetingMessage || "");
        setSelectedVoice(data.config.voiceId || "");
        setSystemPrompt(data.config.systemPrompt || "");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await fetch("/api/voices/list");
      const data = await response.json();

      if (response.ok && data.voices) {
        setAvailableVoices(data.voices);
      }
    } catch (error) {
      console.error("Error fetching voices:", error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleSaveGreeting = async () => {
    if (!greetingMessage.trim()) return;

    try {
      setSaving(true);
      const response = await fetch("/api/agent-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greetingMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSuccessMessage("Begrüßung erfolgreich gespeichert");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving greeting:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!selectedVoice) return;

    const voiceName = availableVoices.find(
      (v) => v.voiceId === selectedVoice
    )?.name;

    try {
      setSaving(true);
      const response = await fetch("/api/agent-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoice,
          voiceName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSuccessMessage("Stimme erfolgreich gespeichert");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving voice:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!systemPrompt.trim()) return;

    try {
      setSaving(true);
      const response = await fetch("/api/agent-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSuccessMessage(
          "System Prompt erfolgreich gespeichert und zu ElevenLabs synchronisiert"
        );
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving system prompt:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestCall = async () => {
    if (!testPhoneNumber.trim()) return;

    // Validate phone number format (basic)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(testPhoneNumber.replace(/\s/g, ""))) {
      setSuccessMessage("");
      alert(
        "Bitte geben Sie eine gültige Telefonnummer ein (z.B. +41791234567)"
      );
      return;
    }

    try {
      setTestingCall(true);
      const response = await fetch("/api/agent/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: testPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          "Testanruf erfolgreich gestartet! Sie werden in Kürze einen Anruf erhalten."
        );
        setTimeout(() => setSuccessMessage(""), 5000);
        setTestPhoneNumber("");
      } else {
        alert(data.error || "Fehler beim Starten des Testanrufs");
      }
    } catch (error) {
      console.error("Error initiating test call:", error);
      alert("Fehler beim Starten des Testanrufs");
    } finally {
      setTestingCall(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Fehler beim Laden der Konfiguration
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* No Agent ID Warning */}
      {config && !config.elevenLabsAgentId && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Agent noch nicht konfiguriert:</strong> Bitte kontaktieren
            Sie den Admin, um eine ElevenLabs Agent ID zu erhalten. Ohne Agent
            ID können keine Einstellungen synchronisiert oder Testanrufe
            durchgeführt werden.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">
          Konfigurieren Sie Ihren Voice AI Agent
        </p>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
          <CardDescription>
            Ihr Voice Agent ist derzeit{" "}
            <Badge variant={config.isActive ? "default" : "secondary"}>
              {config.isActive ? "Aktiv" : "Inaktiv"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Telefonnummer</Label>
              <Input
                value={config.phoneNumber || "Noch nicht zugewiesen"}
                disabled
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ihre dedizierte Telefonnummer wird nach Aktivierung angezeigt
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeting Message */}
      <Card>
        <CardHeader>
          <CardTitle>Begrüßungsnachricht</CardTitle>
          <CardDescription>
            Die Nachricht, die Anrufer als Erstes hören
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="greeting">Begrüßungstext</Label>
              <Textarea
                id="greeting"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className="mt-2"
                rows={4}
                placeholder="Guten Tag, wie kann ich Ihnen helfen?"
                maxLength={200}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {greetingMessage.length}/200 Zeichen
              </p>
            </div>
            <Button
              onClick={handleSaveGreeting}
              disabled={saving || !greetingMessage.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>
            Definieren Sie das Verhalten und die Persönlichkeit Ihres Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="systemPrompt">Instruktionen für den Agent</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="mt-2"
                rows={8}
                placeholder="Du bist ein freundlicher Telefonassistent für eine Schweizer Arztpraxis..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Beschreiben Sie, wie der Agent sich verhalten und auf Anfragen
                reagieren soll
              </p>
            </div>
            <Button
              onClick={handleSaveSystemPrompt}
              disabled={saving || !systemPrompt.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Stimme auswählen</CardTitle>
          <CardDescription>
            Wählen Sie die Stimme für Ihren Agent aus über 5000 verfügbaren
            Stimmen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice">Stimme</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={
                      loadingVoices ? "Lädt Stimmen..." : "Stimme wählen"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.length > 0 ? (
                    availableVoices.map((voice) => (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                        {voice.name}
                        {voice.labels?.accent && ` (${voice.labels.accent})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="loading" value="loading" disabled>
                      {loadingVoices ? "Lädt..." : "Keine Stimmen verfügbar"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Aktuelle Stimme: {config.voiceName || "Nicht konfiguriert"}
              </p>
            </div>
            <Button
              onClick={handleSaveVoice}
              disabled={saving || !selectedVoice || loadingVoices}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RAG Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Wissensdatenbank</CardTitle>
          <CardDescription>
            Laden Sie Dokumente hoch, um Ihrem Agent Kontext zu geben (ab Pro
            Plan)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.ragDocuments &&
            Array.isArray(config.ragDocuments) &&
            config.ragDocuments.length > 0 ? (
              <div className="space-y-2">
                {config.ragDocuments.map(
                  (
                    doc: { name: string; uploadedAt: string },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Hochgeladen:{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString("de-CH")}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                <p className="text-sm text-muted-foreground">
                  Keine Dokumente hochgeladen
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              RAG Document Upload wird in einer späteren Version verfügbar sein
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Call */}
      <Card>
        <CardHeader>
          <CardTitle>Agent testen</CardTitle>
          <CardDescription>
            Starten Sie einen Testanruf, um Ihren Agent auszuprobieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testPhone">Ihre Telefonnummer</Label>
              <Input
                id="testPhone"
                type="tel"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+41 79 123 45 67"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Geben Sie Ihre Nummer im internationalen Format ein (z.B.
                +41791234567)
              </p>
            </div>
            <Button
              onClick={handleTestCall}
              disabled={
                testingCall || !testPhoneNumber.trim() || !config.isActive
              }
            >
              {testingCall ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Startet Anruf...
                </>
              ) : (
                "Testanruf starten"
              )}
            </Button>
            {!config.isActive && (
              <p className="text-sm text-yellow-600">
                Ihr Agent muss zuerst aktiviert werden. Bitte kontaktieren Sie
                den Admin.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

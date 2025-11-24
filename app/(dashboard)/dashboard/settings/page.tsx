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
import { CheckCircle, Loader2 } from "lucide-react";

interface AgentConfig {
  greetingMessage: string | null;
  voiceId: string | null;
  voiceName: string | null;
  enabledLanguages: string[];
  ragDocuments: Array<{ name: string; url: string; uploadedAt: string }> | null;
  phoneNumber: string | null;
  isActive: boolean;
}

const AVAILABLE_VOICES = [
  { id: "rachel", name: "Rachel - Professionell (DE)" },
  { id: "adam", name: "Adam - Freundlich (DE)" },
  { id: "domi", name: "Domi - Energetisch (DE)" },
  { id: "bella", name: "Bella - Warm (DE)" },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [greetingMessage, setGreetingMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");

  useEffect(() => {
    fetchConfig();
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
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
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

    const voiceName = AVAILABLE_VOICES.find(
      (v) => v.id === selectedVoice
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

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Stimme auswählen</CardTitle>
          <CardDescription>
            Wählen Sie die Stimme für Ihren Agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice">Stimme</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Stimme wählen" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Aktuelle Stimme: {config.voiceName || "Nicht konfiguriert"}
              </p>
            </div>
            <Button
              onClick={handleSaveVoice}
              disabled={saving || !selectedVoice}
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
    </div>
  );
}

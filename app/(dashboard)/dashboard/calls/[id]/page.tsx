"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  Clock,
  Calendar,
  MessageSquare,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Bot,
} from "lucide-react";

interface TranscriptMessage {
  role: "user" | "agent";
  message: string;
  time_in_call_secs?: number;
}

interface ExtractedData {
  callerName?: string;
  callerPhone?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentReason?: string;
  notes?: string;
  summary?: string;
}

interface ConversationDetail {
  conversation_id: string;
  agent_id: string;
  agentName: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  transcript: TranscriptMessage[];
  metadata?: Record<string, unknown>;
  analysis?: {
    call_successful?: string;
    transcript_summary?: string;
    data_collection_results?: Record<string, unknown>;
    evaluation_criteria_results?: Record<string, unknown>;
  };
  extractedData?: ExtractedData;
}

export default function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/conversations/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch conversation");
        }

        setConversation(data);
      } catch (err) {
        console.error("Error fetching conversation:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch conversation"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [id]);

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (unixSecs: number) => {
    const date = new Date(unixSecs * 1000);
    return date.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (unixSecs: number) => {
    const date = new Date(unixSecs * 1000);
    return date.toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (
    status: string,
    callSuccessful: string | undefined
  ) => {
    if (status === "done" && callSuccessful === "success") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Erfolgreich
        </Badge>
      );
    }
    if (status === "done" && callSuccessful === "failure") {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Fehlgeschlagen
        </Badge>
      );
    }
    if (status === "done") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Abgeschlossen
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Lade Unterhaltung...
        </span>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/calls")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600">{error || "Unterhaltung nicht gefunden"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/calls")}
            >
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messageCount = conversation.transcript?.length || 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/calls")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zu Unterhaltungen
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Unterhaltung Details
          </h1>
          <p className="text-muted-foreground">
            Agent: {conversation.agentName}
          </p>
        </div>
        {getStatusBadge(
          conversation.status,
          conversation.analysis?.call_successful
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{conversation.agentName}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dauer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(conversation.call_duration_secs)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nachrichten</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeitpunkt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(conversation.start_time_unix_secs)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(conversation.start_time_unix_secs)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zusammenfassung - verwende summary aus data_collection_results (Deutsch) statt transcript_summary (Englisch) */}
      {(conversation.analysis?.data_collection_results?.summary || 
        conversation.analysis?.transcript_summary) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {String(conversation.analysis?.data_collection_results?.summary || 
                conversation.analysis?.transcript_summary)}
            </p>
          </CardContent>
        </Card>
      )}

      {conversation.extractedData &&
        Object.keys(conversation.extractedData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kundendaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {conversation.extractedData.callerName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-sm">
                      {conversation.extractedData.callerName}
                    </p>
                  </div>
                )}
                {conversation.extractedData.callerPhone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Telefon
                    </p>
                    <p className="text-sm">
                      {conversation.extractedData.callerPhone}
                    </p>
                  </div>
                )}
                {conversation.extractedData.appointmentDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Termin Datum
                    </p>
                    <p className="text-sm">
                      {conversation.extractedData.appointmentDate}
                    </p>
                  </div>
                )}
                {conversation.extractedData.appointmentTime && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Termin Uhrzeit
                    </p>
                    <p className="text-sm">
                      {conversation.extractedData.appointmentTime}
                    </p>
                  </div>
                )}
                {conversation.extractedData.appointmentReason && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Grund
                    </p>
                    <p className="text-sm">
                      {conversation.extractedData.appointmentReason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {conversation.analysis?.data_collection_results &&
        Object.keys(conversation.analysis.data_collection_results).filter(k => k !== 'summary').length >
          0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gesammelte Daten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(
                  conversation.analysis.data_collection_results
                )
                  .filter(([key]) => key !== 'summary')
                  .map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-sm">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transkript
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversation.transcript &&
          Array.isArray(conversation.transcript) &&
          conversation.transcript.length > 0 ? (
            <div className="space-y-4">
              {conversation.transcript.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "agent" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                      message.role === "agent"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.role === "agent" ? "🤖 Agent" : "👤 Nutzer"}
                      </span>
                      {message.time_in_call_secs !== undefined && (
                        <span className="text-xs opacity-70">
                          {formatDuration(message.time_in_call_secs)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Kein Transkript verfügbar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technische Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Agent ID:</span>
              <span className="text-muted-foreground break-all">
                {conversation.agent_id}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Conversation ID:</span>
              <span className="text-muted-foreground break-all">
                {conversation.conversation_id}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Status:</span>
              <span className="text-muted-foreground">{conversation.status}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Erfolg:</span>
              <span className="text-muted-foreground">
                {conversation.analysis?.call_successful || "Unbekannt"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

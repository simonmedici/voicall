"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Clock, Calendar } from "lucide-react";

interface CallDetail {
  id: string;
  conversationId: string;
  agentId: string;
  status: string;
  durationSecs: number | null;
  startTime: string | null;
  endTime: string | null;
  transcript: Array<{
    role: string;
    message: string;
    time_in_call_secs?: number;
  }> | null;
  metadata: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
  extractedData: Record<string, unknown> | null;
  hasAudio: boolean;
  audioUrl: string | null;
  minutesCharged: number | null;
  callSuccessful: boolean;
  createdAt: string;
}

export default function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/calls/${id}`);
        const data = await response.json();

        if (response.ok) {
          setCall(data.call);
        } else {
          console.error("Error fetching call:", data.error);
        }
      } catch (error) {
        console.error("Error fetching call:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCallDetail();
  }, [id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Lädt Anrufdetails...</p>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/calls")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Anruf nicht gefunden</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push("/dashboard/calls")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zu Anrufen
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anruf Details</h1>
          <p className="text-muted-foreground">
            Conversation ID: {call.conversationId}
          </p>
        </div>
        <Badge variant={call.callSuccessful ? "default" : "destructive"}>
          {call.callSuccessful ? "Erfolgreich" : "Fehlgeschlagen"}
        </Badge>
      </div>

      {/* Call Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{call.status}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dauer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(call.durationSecs)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minuten</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {call.minutesCharged || 0} Min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeitpunkt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(call.startTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extracted Data */}
      {call.extractedData && Object.keys(call.extractedData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extrahierte Daten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {"callerName" in call.extractedData &&
                call.extractedData.callerName ? (
                  <div>
                    <span className="font-medium">Name: </span>
                    {String(call.extractedData.callerName)}
                  </div>
                ) : null}
              {"appointmentReason" in call.extractedData &&
                call.extractedData.appointmentReason ? (
                  <div>
                    <span className="font-medium">Grund: </span>
                    {String(call.extractedData.appointmentReason)}
                  </div>
                ) : null}
              {"appointmentDate" in call.extractedData &&
                call.extractedData.appointmentDate ? (
                  <div>
                    <span className="font-medium">Termin: </span>
                    {String(call.extractedData.appointmentDate)}
                  </div>
                ) : null}
              {"appointmentTime" in call.extractedData &&
                call.extractedData.appointmentTime ? (
                  <div>
                    <span className="font-medium">Uhrzeit: </span>
                    {String(call.extractedData.appointmentTime)}
                  </div>
                ) : null}
              {"callerPhone" in call.extractedData &&
                call.extractedData.callerPhone ? (
                  <div>
                    <span className="font-medium">Telefon: </span>
                    {String(call.extractedData.callerPhone)}
                  </div>
                ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Transkript</CardTitle>
        </CardHeader>
        <CardContent>
          {call.transcript &&
          Array.isArray(call.transcript) &&
          call.transcript.length > 0 ? (
            <div className="space-y-4">
              {call.transcript.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "agent" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "agent"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.role === "agent" ? "Agent" : "Anrufer"}
                      </span>
                      {message.time_in_call_secs !== undefined && (
                        <span className="text-xs opacity-70">
                          {formatDuration(message.time_in_call_secs)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Kein Transkript verfügbar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technische Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Agent ID:</span>
              <span className="text-muted-foreground">{call.agentId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Conversation ID:</span>
              <span className="text-muted-foreground break-all">
                {call.conversationId}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Start:</span>
              <span className="text-muted-foreground">
                {formatDate(call.startTime)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Ende:</span>
              <span className="text-muted-foreground">
                {formatDate(call.endTime)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Audio verfügbar:</span>
              <span className="text-muted-foreground">
                {call.hasAudio ? "Ja" : "Nein"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

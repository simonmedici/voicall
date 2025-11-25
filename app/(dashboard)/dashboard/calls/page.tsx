"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Conversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  call_successful: string;
}

export default function CallsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/conversations");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch conversations");
        }

        setConversations(data.conversations || []);
        setAgentMap(data.agentMap || {});
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch conversations"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (unixSecs: number) => {
    const date = new Date(unixSecs * 1000);
    return date.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, callSuccessful: string) => {
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
    if (status === "in-progress") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Läuft
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchQuery === "" ||
      conv.conversation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agentMap[conv.agent_id] || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" && conv.call_successful === "success") ||
      (statusFilter === "failure" && conv.call_successful === "failure") ||
      (statusFilter === "unknown" && conv.call_successful === "unknown");

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: conversations.length,
    successful: conversations.filter((c) => c.call_successful === "success")
      .length,
    totalMinutes: Math.round(
      conversations.reduce((acc, c) => acc + (c.call_duration_secs || 0), 0) /
        60
    ),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unterhaltungen</h1>
        <p className="text-muted-foreground">
          Alle Unterhaltungen Ihrer Agents (inkl. Tests)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unterhaltungen gesamt
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erfolgreich</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successful}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtdauer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMinutes} Min</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Suche</CardTitle>
          <CardDescription>
            Filtern Sie Ihre Unterhaltungen nach Agent oder Status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Agent oder Conversation ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="success">Erfolgreich</SelectItem>
                <SelectItem value="failure">Fehlgeschlagen</SelectItem>
                <SelectItem value="unknown">Unbekannt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unterhaltungen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Lade Unterhaltungen...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Erneut versuchen
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Keine Unterhaltungen gefunden.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Starten Sie einen Test mit einem Ihrer Agents, um hier
                Unterhaltungen zu sehen.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Nachrichten</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conv) => (
                    <TableRow
                      key={conv.conversation_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(
                          `/dashboard/calls/${conv.conversation_id}`
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {formatDate(conv.start_time_unix_secs)}
                      </TableCell>
                      <TableCell>
                        {agentMap[conv.agent_id] || "Unbekannter Agent"}
                      </TableCell>
                      <TableCell>
                        {formatDuration(conv.call_duration_secs)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          {conv.message_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(conv.status, conv.call_successful)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/calls/${conv.conversation_id}`
                            );
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Phone,
  Clock,
  CheckCircle,
  Search,
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Conversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  call_successful: string;
}

const ITEMS_PER_PAGE = 10;

export default function CallsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

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

    const convDate = new Date(conv.start_time_unix_secs * 1000);
    
    let matchesDateFrom = true;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDateFrom = convDate >= fromDate;
    }

    let matchesDateTo = true;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateTo = convDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.ceil(filteredConversations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedConversations = filteredConversations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const stats = {
    total: conversations.length,
    successful: conversations.filter((c) => c.call_successful === "success")
      .length,
    totalMinutes: Math.round(
      conversations.reduce((acc, c) => acc + (c.call_duration_secs || 0), 0) /
        60
    ),
  };

  const clearDateFrom = () => setDateFrom("");
  const clearDateTo = () => setDateTo("");
  const clearStatus = () => setStatusFilter("all");

  const hasActiveFilters = dateFrom || dateTo || statusFilter !== "all";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verlauf der Unterhaltung</h1>
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
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Unterhaltungen durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFrom ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      <>
                        Ab {format(new Date(dateFrom), "dd.MM.yyyy", { locale: de })}
                        <X
                          className="ml-2 h-3 w-3 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDateFrom();
                          }}
                        />
                      </>
                    ) : (
                      "+ Datum nach"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Datum nach</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateTo ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateTo ? (
                      <>
                        Bis {format(new Date(dateTo), "dd.MM.yyyy", { locale: de })}
                        <X
                          className="ml-2 h-3 w-3 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDateTo();
                          }}
                        />
                      </>
                    ) : (
                      "+ Datum vor"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Datum vor</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={statusFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                  >
                    {statusFilter !== "all" ? (
                      <>
                        {statusFilter === "success" && "Erfolgreich"}
                        {statusFilter === "failure" && "Fehlgeschlagen"}
                        {statusFilter === "unknown" && "Unbekannt"}
                        <X
                          className="ml-2 h-3 w-3 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearStatus();
                          }}
                        />
                      </>
                    ) : (
                      "+ Anrufstatus"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    <Button
                      variant={statusFilter === "success" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setStatusFilter("success")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Erfolgreich
                    </Button>
                    <Button
                      variant={statusFilter === "failure" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setStatusFilter("failure")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                      Fehlgeschlagen
                    </Button>
                    <Button
                      variant={statusFilter === "unknown" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setStatusFilter("unknown")}
                    >
                      <Clock className="mr-2 h-4 w-4 text-gray-600" />
                      Unbekannt
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setStatusFilter("all");
                  }}
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unterhaltungen</CardTitle>
            {filteredConversations.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {filteredConversations.length} Ergebnis{filteredConversations.length !== 1 ? "se" : ""}
              </p>
            )}
          </div>
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
                {hasActiveFilters
                  ? "Versuchen Sie, die Filter anzupassen."
                  : "Starten Sie einen Test mit einem Ihrer Agents, um hier Unterhaltungen zu sehen."}
              </p>
            </div>
          ) : (
            <>
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
                    {paginatedConversations.map((conv) => (
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Seite {currentPage} von {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Zurück
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-9"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Weiter
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

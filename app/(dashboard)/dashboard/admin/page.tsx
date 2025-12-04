"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Loader2,
  Shield,
  Users,
  Activity,
  Bot,
  UserPlus,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  subscription?: {
    tier: string;
    status: string;
  };
  agents?: Array<{
    id: string;
    name: string;
    elevenLabsAgentId: string;
    isActive: boolean;
  }>;
}

interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  created_at_unix_secs?: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [elevenLabsAgents, setElevenLabsAgents] = useState<ElevenLabsAgent[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, agentsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/elevenlabs-agents"),
      ]);

      if (usersRes.status === 403) {
        setErrorMessage("Keine Admin-Berechtigung");
        return;
      }

      const usersData = await usersRes.json();
      const agentsData = await agentsRes.json();

      if (usersRes.ok) {
        setUsers(usersData.users);
      } else {
        setErrorMessage(usersData.error || "Fehler beim Laden der Benutzer");
      }

      if (agentsRes.ok) {
        setElevenLabsAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const getAgentAssignment = (agentId: string) => {
    for (const u of users) {
      const agent = u.agents?.find((a) => a.elevenLabsAgentId === agentId);
      if (agent) {
        return { user: u, agent };
      }
    }
    return null;
  };

  const handleAssignAgent = async () => {
    if (!selectedUserId || !selectedAgentId) {
      setErrorMessage("Bitte wählen Sie einen Benutzer und einen Agenten aus");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch("/api/admin/assign-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          agentId: selectedAgentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Agent erfolgreich zugewiesen");
        setSelectedUserId("");
        setSelectedAgentId("");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchData();
      } else {
        setErrorMessage(data.error || "Fehler beim Zuweisen");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error assigning agent:", error);
      setErrorMessage("Fehler beim Zuweisen");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setAssigning(false);
    }
  };

  const handleActivateAgent = async (
    agentConfigId: string,
    isActive: boolean
  ) => {
    try {
      const response = await fetch("/api/admin/agent-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentConfigId,
          isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Agent ${isActive ? "aktiviert" : "deaktiviert"}`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchData();
      } else {
        setErrorMessage(data.error || "Fehler beim Aktualisieren");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating agent status:", error);
      setErrorMessage("Fehler beim Aktualisieren");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleUnassignAgent = async (
    agentConfigId: string,
    agentName: string
  ) => {
    if (
      !confirm(
        `Möchten Sie den Agent "${agentName}" wirklich vom Benutzer entfernen?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/unassign-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfigId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Agent "${agentName}" wurde entfernt`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchData();
      } else {
        setErrorMessage(data.error || "Fehler beim Entfernen");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error unassigning agent:", error);
      setErrorMessage("Fehler beim Entfernen");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errorMessage && users.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Zugriff verweigert</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalAssignedAgents = users.reduce(
    (acc, u) => acc + (u.agents?.length || 0),
    0
  );
  const activeAgents = users.reduce(
    (acc, u) => acc + (u.agents?.filter((a) => a.isActive).length || 0),
    0
  );

  return (
    <div className="space-y-8">
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">
          Agenten den Kunden zuweisen und verwalten
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ElevenLabs Agents
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{elevenLabsAgents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zugewiesen</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignedAgents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agent zuweisen
          </CardTitle>
          <CardDescription>
            Wählen Sie einen Kunden und einen ElevenLabs-Agenten aus, um ihn
            zuzuweisen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kunde auswählen</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunde wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => !u.isAdmin)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.email}
                        {u.name && ` (${u.name})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agent auswählen</Label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agent wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {elevenLabsAgents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine Agenten gefunden
                    </SelectItem>
                  ) : (
                    elevenLabsAgents.map((agent) => {
                      const assignment = getAgentAssignment(agent.agent_id);
                      return (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.name}
                          {assignment && (
                            <span className="text-muted-foreground ml-2">
                              → {assignment.user.email}
                            </span>
                          )}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssignAgent}
                disabled={!selectedUserId || !selectedAgentId || assigning}
                className="w-full"
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird zugewiesen...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Zuweisen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer & Agents</CardTitle>
          <CardDescription>
            Übersicht aller registrierten Benutzer und ihrer zugewiesenen Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Zugewiesene Agents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Keine Benutzer gefunden
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {u.email}
                        {u.isAdmin && (
                          <Badge variant="outline" className="ml-2">
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{u.name || "-"}</TableCell>
                      <TableCell>
                        {u.subscription ? (
                          <Badge
                            variant={
                              u.subscription.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {u.subscription.tier}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.agents && u.agents.length > 0 ? (
                          <div className="space-y-2">
                            {u.agents.map((agent) => (
                              <div
                                key={agent.id}
                                className="flex items-center justify-between gap-4 p-2 rounded-lg bg-muted/50"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <span className="font-medium block truncate">
                                      {agent.name}
                                    </span>
                                    <code className="text-xs text-muted-foreground">
                                      {agent.elevenLabsAgentId.slice(0, 16)}...
                                    </code>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge
                                    variant={
                                      agent.isActive ? "default" : "secondary"
                                    }
                                    className={
                                      agent.isActive ? "bg-green-600" : ""
                                    }
                                  >
                                    {agent.isActive ? "Aktiv" : "Inaktiv"}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant={
                                      agent.isActive ? "outline" : "default"
                                    }
                                    onClick={() =>
                                      handleActivateAgent(
                                        agent.id,
                                        !agent.isActive
                                      )
                                    }
                                  >
                                    {agent.isActive
                                      ? "Deaktivieren"
                                      : "Aktivieren"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      handleUnassignAgent(agent.id, agent.name)
                                    }
                                    title="Agent entfernen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Keine Agents zugewiesen
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

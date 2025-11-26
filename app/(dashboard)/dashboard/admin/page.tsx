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

  const assignedAgentIds = new Set(
    users.flatMap((u) => u.agents?.map((a) => a.elevenLabsAgentId) || [])
  );

  const availableAgents = elevenLabsAgents.filter(
    (agent) => !assignedAgentIds.has(agent.agent_id)
  );

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
                  {availableAgents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine verfügbaren Agenten
                    </SelectItem>
                  ) : (
                    availableAgents.map((agent) => (
                      <SelectItem key={agent.agent_id} value={agent.agent_id}>
                        {agent.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableAgents.length === 0 && elevenLabsAgents.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Alle Agenten sind bereits zugewiesen
                </p>
              )}
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssignAgent}
                disabled={
                  !selectedUserId || !selectedAgentId || assigning
                }
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Zugewiesene Agents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Keine Benutzer gefunden
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
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
                        <div className="space-y-1">
                          {u.agents.map((agent) => (
                            <div key={agent.id} className="text-sm">
                              <span className="font-medium">{agent.name}</span>
                              <code className="ml-2 text-xs text-muted-foreground">
                                {agent.elevenLabsAgentId.slice(0, 12)}...
                              </code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.agents && u.agents.length > 0 ? (
                        <div className="space-y-1">
                          {u.agents.map((agent) => (
                            <Badge
                              key={agent.id}
                              variant={agent.isActive ? "default" : "secondary"}
                            >
                              {agent.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.agents && u.agents.length > 0 && (
                        <div className="space-y-1">
                          {u.agents.map((agent) => (
                            <Button
                              key={agent.id}
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleActivateAgent(agent.id, !agent.isActive)
                              }
                            >
                              {agent.isActive ? "Deaktivieren" : "Aktivieren"}
                            </Button>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

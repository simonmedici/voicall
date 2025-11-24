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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Shield, Users, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  agentConfig?: {
    elevenLabsAgentId: string | null;
    isActive: boolean;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");

      if (response.status === 403) {
        setErrorMessage("Keine Admin-Berechtigung");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setErrorMessage(data.error || "Fehler beim Laden der Benutzer");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgentId = async () => {
    if (!selectedUserId || !agentId.trim()) return;

    try {
      setSaving(true);
      const response = await fetch("/api/admin/agent-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          elevenLabsAgentId: agentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Agent ID erfolgreich für User gespeichert`);
        setTimeout(() => setSuccessMessage(""), 3000);
        setAgentId("");
        setSelectedUserId("");
        fetchUsers(); // Refresh list
      } else {
        setErrorMessage(data.error || "Fehler beim Speichern");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving agent ID:", error);
      setErrorMessage("Fehler beim Speichern");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleActivateAgent = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/agent-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Agent ${isActive ? "aktiviert" : "deaktiviert"}`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchUsers();
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

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
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

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">
          Verwalte User und ElevenLabs Agent IDs
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agents konfiguriert
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.agentConfig?.elevenLabsAgentId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.agentConfig?.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent ID Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs Agent ID zuweisen</CardTitle>
          <CardDescription>
            Weise einem User eine Agent ID von ElevenLabs zu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="userId">User auswählen</Label>
                <select
                  id="userId"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">User wählen...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}{" "}
                      {user.agentConfig?.elevenLabsAgentId && "(✓ hat Agent)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="agentId">ElevenLabs Agent ID</Label>
                <Input
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent_abc123xyz..."
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveAgentId}
              disabled={saving || !selectedUserId || !agentId.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                "Agent ID zuweisen"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer</CardTitle>
          <CardDescription>
            Übersicht aller registrierten Benutzer und ihrer Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Agent ID</TableHead>
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
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                      {user.isAdmin && (
                        <Badge variant="outline" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge
                          variant={
                            user.subscription.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.subscription.tier}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {user.agentConfig?.elevenLabsAgentId || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.agentConfig?.isActive ? "default" : "secondary"
                        }
                      >
                        {user.agentConfig?.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.agentConfig?.elevenLabsAgentId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleActivateAgent(
                              user.id,
                              !user.agentConfig?.isActive
                            )
                          }
                        >
                          {user.agentConfig?.isActive
                            ? "Deaktivieren"
                            : "Aktivieren"}
                        </Button>
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

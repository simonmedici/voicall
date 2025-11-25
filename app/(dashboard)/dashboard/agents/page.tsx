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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, TestTube, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  language: string;
  llmModel: string;
  isActive: boolean;
  elevenLabsAgentId: string;
  createdAt: string;
}

interface Subscription {
  tier: "starter" | "pro" | "enterprise";
}

export default function AgentsListPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentLimits = {
    starter: 1,
    pro: 3,
    enterprise: -1, // unlimited
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load agents
      const agentsRes = await fetch("/api/agent?all=true");
      if (!agentsRes.ok) throw new Error("Failed to load agents");
      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents || []);

      // Load subscription
      const subRes = await fetch("/api/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  }

  function canCreateAgent() {
    if (!subscription) return false;
    const limit = agentLimits[subscription.tier];
    return limit === -1 || agents.length < limit;
  }

  function getAgentLimitText() {
    if (!subscription) return "";
    const limit = agentLimits[subscription.tier];
    if (limit === -1) return "Unlimited";
    return `${agents.length}/${limit}`;
  }

  function handleCreateAgent() {
    if (!canCreateAgent()) {
      setError(
        `Agent-Limit erreicht. Ihr ${subscription?.tier} Plan erlaubt maximal ${agentLimits[subscription?.tier || "starter"]} Agent(s).`
      );
      return;
    }
    router.push("/dashboard/agents/create");
  }

  function handleEditAgent(agent: Agent) {
    router.push(`/dashboard/agents/edit?id=${agent.id}`);
  }

  function handleTestAgent(agent: Agent) {
    router.push(
      `/dashboard/agents/test?id=${agent.elevenLabsAgentId}&dbId=${agent.id}&name=${encodeURIComponent(agent.name)}`
    );
  }

  function openDeleteDialog(agent: Agent) {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteAgent() {
    if (!agentToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/agent/delete?agentId=${agentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete agent");
      }

      // Remove from list
      setAgents(agents.filter((a) => a.id !== agentToDelete.id));
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(
        err instanceof Error ? err.message : "Fehler beim Löschen des Agents"
      );
    } finally {
      setIsDeleting(false);
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meine Agents</h1>
          <p className="text-muted-foreground mt-2">
            Erstellen und verwalten Sie Ihre KI-Telefonagenten
          </p>
        </div>
        <Button onClick={handleCreateAgent} disabled={!canCreateAgent()}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Agent
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {subscription.tier.charAt(0).toUpperCase() +
                    subscription.tier.slice(1)}{" "}
                  Plan
                </CardTitle>
                <CardDescription>Agent Limit</CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg">
                {getAgentLimitText()}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agents ({agents.length})</CardTitle>
          <CardDescription>
            Alle Ihre konfigurierten Telefonagenten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Noch keine Agents erstellt
              </p>
              <Button onClick={handleCreateAgent}>
                <Plus className="mr-2 h-4 w-4" />
                Ersten Agent erstellen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sprache</TableHead>
                  <TableHead>Modell</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {agent.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.llmModel}</TableCell>
                    <TableCell>
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(agent.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestAgent(agent)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(agent)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent löschen?</DialogTitle>
            <DialogDescription>
              Möchten Sie den Agent &quot;{agentToDelete?.name}&quot; wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                "Löschen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

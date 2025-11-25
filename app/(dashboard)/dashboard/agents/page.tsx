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
import { Plus, Trash2, TestTube } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  language: string;
  additionalLanguages?: string[];
  llmModel: string;
  isActive: boolean;
  elevenLabsAgentId: string | null;
  voiceName: string | null;
  enableRag: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agent?all=true");

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!agentToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/agent/delete?agentId=${agentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete agent");
      }

      // Refresh list
      await fetchAgents();
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = (agent: Agent) => {
    if (!agent.elevenLabsAgentId) {
      setError("Agent hat keine ElevenLabs ID");
      return;
    }
    // Navigate to test page with agent details
    router.push(
      `/dashboard/agents/test?id=${agent.elevenLabsAgentId}&name=${encodeURIComponent(agent.name)}`
    );
  };

  const getLanguageDisplay = (agent: Agent) => {
    const primary = agent.language.toUpperCase();
    const additional =
      agent.additionalLanguages?.map((l) => l.toUpperCase()) || [];
    return additional.length > 0
      ? `${primary} (+${additional.join(", ")})`
      : primary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meine Agents</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre konversationalen AI-Agents
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/agents/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Neuer Agent
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {agents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Noch keine Agents</CardTitle>
            <CardDescription>
              Erstellen Sie Ihren ersten konversationalen Agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/agents/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Agent erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ihre Agents ({agents.length})</CardTitle>
            <CardDescription>
              Alle Ihre konfigurierten konversationalen Agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sprachen</TableHead>
                  <TableHead>LLM Model</TableHead>
                  <TableHead>Stimme</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{getLanguageDisplay(agent)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {agent.llmModel}
                      </code>
                    </TableCell>
                    <TableCell>
                      {agent.voiceName || (
                        <span className="text-gray-400">
                          Nicht konfiguriert
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agent.enableRag && (
                        <Badge variant="secondary" className="text-xs">
                          RAG
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {agent.isActive ? (
                        <Badge variant="default">Aktiv</Badge>
                      ) : (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(agent)}
                          title="Agent testen"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/agents/edit?id=${agent.id}`)
                          }
                          title="Bearbeiten"
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setAgentToDelete(agent);
                            setDeleteDialogOpen(true);
                          }}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie den Agent &quot;{agentToDelete?.name}&quot; wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAgentToDelete(null);
              }}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

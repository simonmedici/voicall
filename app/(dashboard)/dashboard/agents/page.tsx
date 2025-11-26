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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, TestTube, Loader2, Bot, Phone } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  language: string;
  llmModel: string;
  isActive: boolean;
  elevenLabsAgentId: string;
  createdAt: string;
  firstMessage?: string;
}

export default function AgentsListPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const agentsRes = await fetch("/api/agent?all=true");
      if (!agentsRes.ok) throw new Error("Failed to load agents");
      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  }

  function handleEditAgent(agent: Agent) {
    router.push(`/dashboard/agents/edit?id=${agent.id}`);
  }

  function handleTestAgent(agent: Agent) {
    router.push(
      `/dashboard/agents/test?id=${agent.elevenLabsAgentId}&dbId=${agent.id}&name=${encodeURIComponent(agent.name)}`
    );
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
            Verwalten Sie Ihre KI-Telefonagenten
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agents ({agents.length})
          </CardTitle>
          <CardDescription>
            Ihre zugewiesenen Telefonagenten - Sie können Stimme und
            Begrüssung anpassen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Noch keine Agents</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ihr Administrator wird Ihnen einen KI-Telefonagenten zuweisen.
                Sobald ein Agent zugewiesen wurde, können Sie hier die Stimme
                und die erste Begrüssung anpassen.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sprache</TableHead>
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
                          title="Agent testen"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                          title="Stimme & Begrüssung bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}

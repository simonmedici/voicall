import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Clock, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { call, agentConfig } from "@/lib/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

async function getDashboardStats(userId: string) {
  const userAgents = await db
    .select({ elevenLabsAgentId: agentConfig.elevenLabsAgentId, name: agentConfig.name })
    .from(agentConfig)
    .where(eq(agentConfig.userId, userId));

  const agentIds = userAgents.map((a) => a.elevenLabsAgentId);
  const agentNameMap = Object.fromEntries(
    userAgents.map((a) => [a.elevenLabsAgentId, a.name])
  );

  if (agentIds.length === 0) {
    return {
      totalCalls: 0,
      callsToday: 0,
      minutesUsedThisMonth: 0,
      successRate: 0,
      recentCalls: [],
      agentNameMap: {},
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalCallsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(call)
    .where(inArray(call.agentId, agentIds));

  const [callsTodayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(call)
    .where(
      and(
        inArray(call.agentId, agentIds),
        gte(call.createdAt, today)
      )
    );

  const [minutesResult] = await db
    .select({ 
      total: sql<number>`COALESCE(SUM(minutes_charged), 0)::real` 
    })
    .from(call)
    .where(
      and(
        inArray(call.agentId, agentIds),
        gte(call.createdAt, firstDayOfMonth)
      )
    );

  const [successResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      successful: sql<number>`SUM(CASE WHEN call_successful = true THEN 1 ELSE 0 END)::int`,
    })
    .from(call)
    .where(inArray(call.agentId, agentIds));

  const recentCalls = await db
    .select({
      id: call.id,
      conversationId: call.conversationId,
      agentId: call.agentId,
      status: call.status,
      durationSecs: call.durationSecs,
      callSuccessful: call.callSuccessful,
      createdAt: call.createdAt,
    })
    .from(call)
    .where(inArray(call.agentId, agentIds))
    .orderBy(sql`${call.createdAt} DESC`)
    .limit(5);

  const totalCalls = totalCallsResult?.count || 0;
  const callsToday = callsTodayResult?.count || 0;
  const minutesUsedThisMonth = Math.round((minutesResult?.total || 0) * 10) / 10;
  
  const successRate = successResult?.total > 0
    ? Math.round((successResult.successful / successResult.total) * 100)
    : 0;

  return {
    totalCalls,
    callsToday,
    minutesUsedThisMonth,
    successRate,
    recentCalls,
    agentNameMap,
  };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusBadge(status: string, successful: boolean) {
  if (status === "done" && successful) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Erfolgreich
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Abgeschlossen
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Läuft
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Fehlgeschlagen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      {status}
    </span>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Übersicht</h1>
        <p className="text-muted-foreground">
          Willkommen zurück! Hier ist eine Zusammenfassung Ihrer Voice AI
          Aktivitäten.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anrufe gesamt</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">Alle Zeit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heute</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsToday}</div>
            <p className="text-xs text-muted-foreground">Anrufe heute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minuten genutzt
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.minutesUsedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Diesen Monat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Erfolgreiche Anrufe</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Anrufe</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentCalls.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>Noch keine Anrufe vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentCalls.map((callItem) => (
                <div
                  key={callItem.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {stats.agentNameMap[callItem.agentId] || "Unbekannter Agent"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {callItem.createdAt
                          ? formatDistanceToNow(new Date(callItem.createdAt), {
                              addSuffix: true,
                              locale: de,
                            })
                          : "Unbekannt"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDuration(callItem.durationSecs)}
                      </p>
                      <p className="text-sm text-muted-foreground">Dauer</p>
                    </div>
                    {getStatusBadge(callItem.status, callItem.callSuccessful)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erste Schritte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Voice Agent konfigurieren</p>
                <p className="text-sm text-muted-foreground">
                  Passen Sie Ihre Begrüßungsnachricht und Stimme an
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Telefonnummer erhalten</p>
                <p className="text-sm text-muted-foreground">
                  Ihr Agent erhält eine dedizierte Telefonnummer
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Erste Anrufe empfangen</p>
                <p className="text-sm text-muted-foreground">
                  Ihr Agent ist bereit, Anrufe entgegenzunehmen
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

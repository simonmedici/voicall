import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Clock, CheckCircle, TrendingUp, Loader2, ShieldCheck, Languages } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { call, agentConfig, subscription } from "@/lib/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { listConversations } from "@/lib/elevenlabs";
import { Badge } from "@/components/ui/badge";

const PLAN_CONFIG: Record<string, { name: string; minutes: number; color: string }> = {
  free: { name: "Free", minutes: 0, color: "bg-gray-500" },
  starter: { name: "Starter", minutes: 500, color: "bg-blue-500" },
  pro: { name: "Pro", minutes: 1500, color: "bg-purple-500" },
  enterprise: { name: "Enterprise", minutes: -1, color: "bg-amber-500" },
};

async function getElevenLabsUsage(agentIds: string[]) {
  if (agentIds.length === 0) {
    return { totalCalls: 0, callsToday: 0, minutesUsedThisMonth: 0, successRate: 0, recentCalls: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfMonthUnix = Math.floor(firstDayOfMonth.getTime() / 1000);
  const todayUnix = Math.floor(today.getTime() / 1000);

  let allConversations: Array<{
    conversation_id: string;
    agent_id: string;
    status: string;
    start_time_unix_secs: number;
    call_duration_secs: number;
    call_successful: string;
  }> = [];

  for (const agentId of agentIds) {
    try {
      const result = await listConversations(agentId, { pageSize: 100 });
      allConversations = [...allConversations, ...result.conversations];
    } catch (error) {
      console.error(`Failed to fetch conversations for agent ${agentId}:`, error);
    }
  }

  const totalCalls = allConversations.length;
  
  const callsToday = allConversations.filter(
    (c) => c.start_time_unix_secs >= todayUnix
  ).length;

  const callsThisMonth = allConversations.filter(
    (c) => c.start_time_unix_secs >= firstDayOfMonthUnix
  );

  const minutesUsedThisMonth = Math.round(
    callsThisMonth.reduce((acc, c) => acc + (c.call_duration_secs || 0), 0) / 60 * 10
  ) / 10;

  const successfulCalls = allConversations.filter(
    (c) => c.call_successful === "success"
  ).length;

  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

  const recentCalls = allConversations
    .sort((a, b) => b.start_time_unix_secs - a.start_time_unix_secs)
    .slice(0, 5)
    .map((c) => ({
      id: c.conversation_id,
      conversationId: c.conversation_id,
      agentId: c.agent_id,
      status: c.status,
      durationSecs: c.call_duration_secs,
      callSuccessful: c.call_successful === "success",
      createdAt: new Date(c.start_time_unix_secs * 1000),
    }));

  return {
    totalCalls,
    callsToday,
    minutesUsedThisMonth,
    successRate,
    recentCalls,
  };
}

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

  const dbHasCalls = (totalCallsResult?.count || 0) > 0;

  if (!dbHasCalls) {
    const elevenLabsStats = await getElevenLabsUsage(agentIds);
    return {
      ...elevenLabsStats,
      agentNameMap,
    };
  }

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

async function getUserSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  return sub;
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

  const [stats, userSub] = await Promise.all([
    getDashboardStats(session.user.id),
    getUserSubscription(session.user.id),
  ]);

  const tier = userSub?.tier || "free";
  const planConfig = PLAN_CONFIG[tier] || PLAN_CONFIG.free;
  const minutesIncluded = userSub?.minutesIncluded || planConfig.minutes;
  const isUnlimited = minutesIncluded === -1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Übersicht</h1>
          <p className="text-muted-foreground">
            Willkommen zurück! Hier ist eine Zusammenfassung Ihrer Voice AI
            Aktivitäten.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${planConfig.color}`} />
          <Badge variant="outline" className="text-sm">
            {planConfig.name} Plan
          </Badge>
        </div>
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
            <div className="text-2xl font-bold">
              {stats.minutesUsedThisMonth}
              {!isUnlimited && (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ {minutesIncluded}
                </span>
              )}
            </div>
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

      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Datenschutz-Status: Aktiv</h3>
                <p className="text-sm text-green-700">Zero PII-Retention - Keine Patientendaten werden gespeichert</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-green-200">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Zero-Retention aktiv</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-red-200">
                <span className="text-sm">🇨🇭</span>
                <Languages className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Schweizerdeutsch</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

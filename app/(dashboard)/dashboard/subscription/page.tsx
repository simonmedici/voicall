import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StripePortalButton } from "@/components/dashboard/stripe-portal-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription, call, agentConfig } from "@/lib/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Phone, Clock, TrendingUp } from "lucide-react";
import { listConversations } from "@/lib/elevenlabs";

const PLAN_CONFIG: Record<
  string,
  { name: string; minutes: number; color: string }
> = {
  free: { name: "Free", minutes: 0, color: "bg-gray-500" },
  starter: { name: "Starter", minutes: 500, color: "bg-blue-500" },
  pro: { name: "Pro", minutes: 1500, color: "bg-purple-500" },
  enterprise: { name: "Enterprise", minutes: -1, color: "bg-amber-500" },
};

async function getElevenLabsUsage(agentIds: string[]) {
  if (agentIds.length === 0) {
    return { totalMinutesUsed: 0, totalCalls: 0 };
  }

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfMonthUnix = Math.floor(firstDayOfMonth.getTime() / 1000);

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

  const callsThisMonth = allConversations.filter(
    (c) => c.start_time_unix_secs >= firstDayOfMonthUnix
  );

  const totalMinutesUsed = Math.round(
    callsThisMonth.reduce((acc, c) => acc + (c.call_duration_secs || 0), 0) / 60
  );

  return {
    totalMinutesUsed,
    totalCalls: allConversations.length,
  };
}

export default async function SubscriptionPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    redirect("/login");
  }

  const [userSubscription] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, session.user.id))
    .limit(1);

  const userAgents = await db
    .select({ elevenLabsAgentId: agentConfig.elevenLabsAgentId })
    .from(agentConfig)
    .where(eq(agentConfig.userId, session.user.id));

  const agentIds = userAgents.map((a) => a.elevenLabsAgentId);

  let totalMinutesUsed = 0;
  let totalCalls = 0;

  if (agentIds.length > 0) {
    const periodStart = userSubscription?.currentPeriodStart || new Date(0);

    const [dbUsageResult] = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${call.minutesCharged}), 0)`,
        totalCalls: sql<number>`COUNT(*)`,
      })
      .from(call)
      .where(
        and(
          inArray(call.agentId, agentIds),
          gte(call.createdAt, periodStart)
        )
      );

    const dbHasCalls = (dbUsageResult?.totalCalls || 0) > 0;

    if (dbHasCalls) {
      totalMinutesUsed = Math.round(Number(dbUsageResult?.totalMinutes) || 0);
      totalCalls = Number(dbUsageResult?.totalCalls) || 0;
    } else {
      const elevenLabsUsage = await getElevenLabsUsage(agentIds);
      totalMinutesUsed = elevenLabsUsage.totalMinutesUsed;
      totalCalls = elevenLabsUsage.totalCalls;
    }
  }

  const tier = userSubscription?.tier || "free";
  const status = userSubscription?.status || "inactive";
  const planConfig = PLAN_CONFIG[tier] || PLAN_CONFIG.free;
  const minutesIncluded =
    userSubscription?.minutesIncluded || planConfig.minutes;
  const isUnlimited = minutesIncluded === -1;

  const usagePercentage = isUnlimited
    ? 0
    : minutesIncluded > 0
      ? Math.min((totalMinutesUsed / minutesIncluded) * 100, 100)
      : 0;

  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  const nextBillingDate = userSubscription?.currentPeriodEnd
    ? new Date(userSubscription.currentPeriodEnd)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihr Abonnement und sehen Sie Ihre Nutzung
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${planConfig.color}`}
              />
              <div>
                <CardTitle className="flex items-center gap-2">
                  {planConfig.name} Plan
                </CardTitle>
                <CardDescription>
                  {isUnlimited
                    ? "Unbegrenzte Minuten"
                    : `${minutesIncluded} Minuten pro Monat`}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className={status === "active" ? "bg-green-600" : ""}
            >
              {status === "active" ? "Aktiv" : status === "trialing" ? "Testphase" : "Inaktiv"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Minuten genutzt</p>
                <p className="text-lg font-semibold">
                  {totalMinutesUsed}
                  {!isUnlimited && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {minutesIncluded}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Anrufe gesamt</p>
                <p className="text-lg font-semibold">{totalCalls}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Aktive Agents</p>
                <p className="text-lg font-semibold">{agentIds.length}</p>
              </div>
            </div>
          </div>

          {!isUnlimited && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nutzung diesen Monat</span>
                <span
                  className={`text-sm font-medium ${
                    isOverLimit
                      ? "text-red-600"
                      : isNearLimit
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {Math.round(usagePercentage)}%
                </span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    isOverLimit
                      ? "bg-red-500"
                      : isNearLimit
                        ? "bg-amber-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              {isNearLimit && !isOverLimit && (
                <p className="text-sm text-amber-600 mt-2">
                  Sie haben 80% Ihres Kontingents verbraucht. Erwägen Sie ein Upgrade.
                </p>
              )}
              {isOverLimit && (
                <p className="text-sm text-red-600 mt-2">
                  Minutenlimit erreicht! Bitte upgraden Sie Ihren Plan.
                </p>
              )}
            </div>
          )}

          {nextBillingDate && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Nächste Abrechnung</p>
                <p className="text-sm text-muted-foreground">
                  {nextBillingDate.toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {userSubscription?.cancelAtPeriodEnd && (
                <Badge variant="secondary">Wird gekündigt</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan ändern oder kündigen</CardTitle>
          <CardDescription>
            Verwalten Sie Ihr Abonnement über das Stripe Portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Im Stripe Kundenportal können Sie:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Ihren Plan upgraden oder downgraden</li>
            <li>Zahlungsmethoden verwalten</li>
            <li>Rechnungen herunterladen</li>
            <li>Ihr Abonnement kündigen</li>
          </ul>
          <div className="pt-4">
            <StripePortalButton />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Pläne</CardTitle>
          <CardDescription>
            Vergleichen Sie unsere Pläne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div
              className={`p-4 rounded-lg border-2 ${
                tier === "starter" ? "border-blue-500 bg-blue-50" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="font-semibold">Starter</h3>
                {tier === "starter" && (
                  <Badge variant="outline" className="ml-auto">
                    Aktuell
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">
                CHF 199<span className="text-sm font-normal">/Monat</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">500 Minuten</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${
                tier === "pro" ? "border-purple-500 bg-purple-50" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <h3 className="font-semibold">Pro</h3>
                {tier === "pro" && (
                  <Badge variant="outline" className="ml-auto">
                    Aktuell
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">
                CHF 349<span className="text-sm font-normal">/Monat</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">1500 Minuten</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${
                tier === "enterprise"
                  ? "border-amber-500 bg-amber-50"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-semibold">Enterprise</h3>
                {tier === "enterprise" && (
                  <Badge variant="outline" className="ml-auto">
                    Aktuell
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">
                CHF 499<span className="text-sm font-normal">/Monat</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Unbegrenzte Minuten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

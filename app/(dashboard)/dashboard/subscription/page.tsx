import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StripePortalButton } from "@/components/dashboard/stripe-portal-button";

export default async function SubscriptionPage() {
  // TODO: Fetch real subscription data
  const futureDate = new Date("2025-12-24");
  const subscription = {
    tier: "starter",
    status: "active",
    minutesIncluded: 500,
    minutesUsed: 0,
    currentPeriodEnd: futureDate,
  };

  const tierNames: Record<string, string> = {
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const usagePercentage =
    (subscription.minutesUsed / subscription.minutesIncluded) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abo-Verwaltung</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihr Abonnement und sehen Sie Ihre Nutzung
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aktueller Plan</CardTitle>
              <CardDescription>
                Sie sind derzeit auf dem {tierNames[subscription.tier]} Plan
              </CardDescription>
            </div>
            <Badge
              variant={
                subscription.status === "active" ? "default" : "secondary"
              }
            >
              {subscription.status === "active" ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Minuten genutzt</span>
              <span className="text-sm text-muted-foreground">
                {subscription.minutesUsed} / {subscription.minutesIncluded} Min
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Nächste Abrechnung</p>
              <p className="text-sm text-muted-foreground">
                {subscription.currentPeriodEnd.toLocaleDateString("de-CH")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade/Manage */}
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
    </div>
  );
}

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardNav } from "@/components/dashboard/nav";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { subscription, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin - admins always have access
  const [userData] = await db
    .select({ isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const isAdmin = userData?.isAdmin || false;

  // Check for active subscription (only if not admin)
  if (!isAdmin) {
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    // No subscription or not active - redirect to paywall
    if (!sub || sub.status !== "active") {
      redirect("/subscribe");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

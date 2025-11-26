import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { user, agentConfig, subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all users with their subscriptions and agent configs
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      })
      .from(user);

    // Fetch subscriptions for all users
    const subscriptions = await db.select().from(subscription);
    const agentConfigs = await db.select().from(agentConfig);

    // Combine data - support multiple agents per user
    const usersWithDetails = users.map((u) => {
      const userSubscription = subscriptions.find((s) => s.userId === u.id);
      const userAgents = agentConfigs.filter((a) => a.userId === u.id);

      return {
        ...u,
        subscription: userSubscription
          ? {
              tier: userSubscription.tier,
              status: userSubscription.status,
            }
          : null,
        agents: userAgents.map((a) => ({
          id: a.id,
          name: a.name,
          elevenLabsAgentId: a.elevenLabsAgentId,
          isActive: a.isActive,
        })),
      };
    });

    return NextResponse.json({ users: usersWithDetails });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

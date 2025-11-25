import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/agent - Get user's agent configuration(s)
 * Query params:
 *   - agentId: specific agent ID (optional)
 *   - all: if true, returns all agents for user
 */
export async function GET(request: NextRequest) {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const getAll = searchParams.get("all") === "true";

    // Get specific agent by ID
    if (agentId) {
      const [config] = await db
        .select()
        .from(agentConfig)
        .where(
          and(
            eq(agentConfig.id, agentId),
            eq(agentConfig.userId, session.user.id)
          )
        )
        .limit(1);

      if (!config) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      return NextResponse.json(config);
    }

    // Get all agents for user
    if (getAll) {
      const configs = await db
        .select()
        .from(agentConfig)
        .where(eq(agentConfig.userId, session.user.id))
        .orderBy(agentConfig.createdAt);

      return NextResponse.json({
        agents: configs,
        count: configs.length,
      });
    }

    // Legacy behavior: get first agent (for backward compatibility)
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    if (!config) {
      return NextResponse.json(
        { error: "Agent configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to fetch agent config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

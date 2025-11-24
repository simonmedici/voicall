import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/agent - Get current user's agent configuration
 */
export async function GET() {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();
    
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    if (config.length === 0) {
      return NextResponse.json(
        { error: "Agent configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config[0]);
  } catch (error) {
    console.error("Failed to fetch agent config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

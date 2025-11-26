import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { agentConfigId } = await request.json();

    if (!agentConfigId) {
      return NextResponse.json(
        { error: "Agent config ID is required" },
        { status: 400 }
      );
    }

    const [existingConfig] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, agentConfigId))
      .limit(1);

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Agent configuration not found" },
        { status: 404 }
      );
    }

    await db.delete(agentConfig).where(eq(agentConfig.id, agentConfigId));

    return NextResponse.json({
      success: true,
      message: "Agent wurde vom Benutzer entfernt",
    });
  } catch (error) {
    console.error("Error unassigning agent:", error);
    return NextResponse.json(
      { error: "Failed to unassign agent" },
      { status: 500 }
    );
  }
}

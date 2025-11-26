import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { user, agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/agent-id - Assign ElevenLabs Agent ID to user (admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { agentConfigId, isActive } = body;

    if (!agentConfigId) {
      return NextResponse.json(
        { error: "agentConfigId is required" },
        { status: 400 }
      );
    }

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive is required" },
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
        { error: "Agent config not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(agentConfig)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(agentConfig.id, agentConfigId))
      .returning();

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error) {
    console.error("Error assigning agent ID:", error);
    return NextResponse.json(
      { error: "Failed to assign agent ID" },
      { status: 500 }
    );
  }
}

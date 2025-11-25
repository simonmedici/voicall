import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { user, agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    const { userId, elevenLabsAgentId, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if agent config exists
    const [existingConfig] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId))
      .limit(1);

    if (existingConfig) {
      // Update existing config
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (elevenLabsAgentId !== undefined) {
        updateData.elevenLabsAgentId = elevenLabsAgentId;
      }
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      const [updated] = await db
        .update(agentConfig)
        .set(updateData)
        .where(eq(agentConfig.userId, userId))
        .returning();

      return NextResponse.json({
        success: true,
        config: updated,
      });
    } else {
      // Create new config
      if (!elevenLabsAgentId) {
        return NextResponse.json(
          { error: "elevenLabsAgentId is required for new config" },
          { status: 400 }
        );
      }

      const [created] = await db
        .insert(agentConfig)
        .values({
          id: randomUUID(),
          userId,
          elevenLabsAgentId,
          name: "Praxis-Assistent",
          voiceId: "default",
          systemPrompt:
            "Du bist ein freundlicher Telefonassistent für eine Schweizer Arztpraxis. Du sprichst Schweizerdeutsch und hilfst Patienten bei Terminvereinbarungen und allgemeinen Anfragen.",
          firstMessage: "Grüezi! Wie kann ich Ihnen helfen?",
          language: "de",
          isActive: isActive !== undefined ? isActive : false,
        })
        .returning();

      return NextResponse.json({
        success: true,
        config: created,
      });
    }
  } catch (error) {
    console.error("Error assigning agent ID:", error);
    return NextResponse.json(
      { error: "Failed to assign agent ID" },
      { status: 500 }
    );
  }
}

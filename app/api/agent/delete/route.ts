import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteAgent } from "@/lib/elevenlabs";

/**
 * DELETE /api/agent/delete - Delete an agent
 * Removes agent from both ElevenLabs and database
 */
export async function DELETE(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId parameter" },
        { status: 400 }
      );
    }

    // Get agent config to verify ownership and get ElevenLabs agent ID
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
      return NextResponse.json(
        { error: "Agent not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete from ElevenLabs first
    if (config.elevenLabsAgentId) {
      try {
        console.log(
          "🗑️ Deleting agent from ElevenLabs:",
          config.elevenLabsAgentId
        );
        await deleteAgent(config.elevenLabsAgentId);
      } catch (err) {
        console.warn(
          "⚠️ Failed to delete from ElevenLabs, but continuing:",
          err
        );
        // Continue anyway to clean up database
      }
    }

    // Delete from database
    await db
      .delete(agentConfig)
      .where(
        and(
          eq(agentConfig.id, agentId),
          eq(agentConfig.userId, session.user.id)
        )
      );

    console.log("✅ Agent deleted successfully:", agentId);

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

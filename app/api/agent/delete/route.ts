import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteAgent } from "@/lib/elevenlabs";

/**
 * DELETE /api/agent/delete - Delete an agent (ADMIN ONLY)
 * Removes agent from both ElevenLabs and database
 * 
 * Note: Only admins can delete agents. Regular users cannot delete
 * agents assigned to them.
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

    // Check if user is admin
    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only admins can delete agents" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId parameter" },
        { status: 400 }
      );
    }

    // Get agent config (admin can delete any agent)
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, agentId))
      .limit(1);

    if (!config) {
      return NextResponse.json(
        { error: "Agent not found" },
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

    // Delete from database (admin can delete any agent)
    await db
      .delete(agentConfig)
      .where(eq(agentConfig.id, agentId));

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

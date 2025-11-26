import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig, user } from "@/lib/db/schema";
import { updateAgent } from "@/lib/elevenlabs";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/agents/[id] - Update an existing agent
 * Based on: https://elevenlabs.io/docs/api-reference/update-agent
 * 
 * Note: Regular users can only update voiceId and firstMessage.
 * Admins can update all fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isAdmin = currentUser?.isAdmin || false;

    // Get agent from DB
    const [agent] = await db
      .select()
      .from(agentConfig)
      .where(
        and(eq(agentConfig.id, id), eq(agentConfig.userId, session.user.id))
      )
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Parse update data
    const body = await request.json();

    // For non-admins, only allow voiceId and firstMessage updates
    if (!isAdmin) {
      const allowedFields = ["voiceId", "firstMessage"];
      const requestedFields = Object.keys(body);
      const disallowedFields = requestedFields.filter(
        (f) => !allowedFields.includes(f)
      );

      if (disallowedFields.length > 0) {
        return NextResponse.json(
          {
            error: `Nicht erlaubt: ${disallowedFields.join(", ")}. Sie können nur Stimme und Begrüssung ändern.`,
          },
          { status: 403 }
        );
      }
    }

    const { voiceId, firstMessage, name, systemPrompt, language, llmModel, temperature, maxTokens } = body;

    // Build update object based on user role
    const elevenLabsUpdate: Record<string, unknown> = {};
    const dbUpdate: Record<string, unknown> = { updatedAt: new Date() };

    // Fields allowed for all users
    if (voiceId) {
      elevenLabsUpdate.voiceId = voiceId;
      dbUpdate.voiceId = voiceId;
    }
    if (firstMessage) {
      elevenLabsUpdate.firstMessage = firstMessage;
      dbUpdate.firstMessage = firstMessage;
    }

    // Fields only for admins
    if (isAdmin) {
      if (name) {
        elevenLabsUpdate.name = name;
        dbUpdate.name = name;
      }
      if (systemPrompt) {
        elevenLabsUpdate.systemPrompt = systemPrompt;
        dbUpdate.systemPrompt = systemPrompt;
      }
      if (language) {
        elevenLabsUpdate.language = language;
        dbUpdate.language = language;
      }
      if (llmModel) {
        elevenLabsUpdate.llmModel = llmModel;
        dbUpdate.llmModel = llmModel;
      }
      if (temperature !== undefined) {
        elevenLabsUpdate.temperature = temperature;
        dbUpdate.temperature = temperature;
      }
      if (maxTokens) {
        elevenLabsUpdate.maxTokens = maxTokens;
        dbUpdate.maxTokens = maxTokens;
      }
    }

    // Update in ElevenLabs
    if (Object.keys(elevenLabsUpdate).length > 0) {
      await updateAgent(agent.elevenLabsAgentId, elevenLabsUpdate);
    }

    // Update in database
    await db
      .update(agentConfig)
      .set(dbUpdate)
      .where(
        and(eq(agentConfig.id, id), eq(agentConfig.userId, session.user.id))
      );

    console.log("✅ Agent updated:", id);

    return NextResponse.json({
      success: true,
      agentId: id,
    });
  } catch (error) {
    console.error("❌ Failed to update agent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update agent",
      },
      { status: 500 }
    );
  }
}

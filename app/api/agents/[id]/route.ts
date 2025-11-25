import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { updateAgent } from "@/lib/elevenlabs";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/agents/[id] - Update an existing agent
 * Based on: https://elevenlabs.io/docs/api-reference/update-agent
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

    const {
      name,
      voiceId,
      systemPrompt,
      firstMessage,
      language,
      llmModel,
      temperature,
      maxTokens,
    } = body;

    // Update in ElevenLabs
    await updateAgent(agent.elevenLabsAgentId, {
      name,
      voiceId,
      systemPrompt,
      firstMessage,
      language,
      llmModel,
      temperature,
      maxTokens,
    });

    // Update in database
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (voiceId) updateData.voiceId = voiceId;
    if (systemPrompt) updateData.systemPrompt = systemPrompt;
    if (firstMessage) updateData.firstMessage = firstMessage;
    if (language) updateData.language = language;
    if (llmModel) updateData.llmModel = llmModel;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (maxTokens) updateData.maxTokens = maxTokens;

    await db
      .update(agentConfig)
      .set(updateData)
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

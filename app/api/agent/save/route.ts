import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateAgent } from "@/lib/elevenlabs";

/**
 * POST /api/agent/save - Update agent configuration
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

    const body = await request.json();
    const {
      agentId,
      name,
      voiceId,
      voiceName,
      systemPrompt,
      greetingMessage,
      language,
      additionalLanguages,
      llmModel,
      llmTemperature,
      maxTokens,
      turnTimeout,
      turnEagerness,
      enableInterruptions,
      disableFirstMessageInterruptions,
      maxDuration,
      dynamicVariables,
      enableRag,
      ragDocuments,
      isActive,
    } = body;

    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
    }

    // Verify ownership
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
        { error: "Agent not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Update in ElevenLabs if agent exists
    if (config.elevenLabsAgentId) {
      console.log("🔄 Updating agent in ElevenLabs:", config.elevenLabsAgentId);

      const result = await updateAgent(config.elevenLabsAgentId, {
        name: name || config.name,
        voiceId: voiceId || config.voiceId || "",
        systemPrompt: systemPrompt || config.systemPrompt,
        language: language || config.language,
        additionalLanguages:
          additionalLanguages || config.additionalLanguages || [],
        firstMessage: greetingMessage || config.greetingMessage,
        llmModel: llmModel || config.llmModel,
        llmTemperature: llmTemperature ?? config.llmTemperature,
        maxTokens: maxTokens ?? config.maxTokens,
        turnTimeout: turnTimeout ?? config.turnTimeout,
        turnEagerness: (turnEagerness || config.turnEagerness) as
          | "eager"
          | "normal"
          | "patient",
        enableInterruptions: enableInterruptions ?? config.enableInterruptions,
        maxDuration: maxDuration ?? config.maxDuration,
        ragDocuments:
          ragDocuments ||
          (config.ragDocuments as Array<{
            id: string;
            name: string;
            type: "url" | "file" | "text";
          }>) ||
          [],
        enableRag: enableRag ?? config.enableRag,
      });

      if (!result.success) {
        console.error("⚠️ Failed to update ElevenLabs agent:", result.error);
        // Continue anyway to update database
      }
    }

    // Update database
    const [updatedConfig] = await db
      .update(agentConfig)
      .set({
        name: name ?? config.name,
        voiceId: voiceId ?? config.voiceId,
        voiceName: voiceName ?? config.voiceName,
        systemPrompt: systemPrompt ?? config.systemPrompt,
        greetingMessage: greetingMessage ?? config.greetingMessage,
        language: language ?? config.language,
        additionalLanguages: additionalLanguages ?? config.additionalLanguages,
        llmModel: llmModel ?? config.llmModel,
        llmTemperature: llmTemperature ?? config.llmTemperature,
        maxTokens: maxTokens ?? config.maxTokens,
        turnTimeout: turnTimeout ?? config.turnTimeout,
        turnEagerness: turnEagerness ?? config.turnEagerness,
        enableInterruptions: enableInterruptions ?? config.enableInterruptions,
        disableFirstMessageInterruptions:
          disableFirstMessageInterruptions ??
          config.disableFirstMessageInterruptions,
        maxDuration: maxDuration ?? config.maxDuration,
        dynamicVariables: dynamicVariables ?? config.dynamicVariables,
        enableRag: enableRag ?? config.enableRag,
        ragDocuments: ragDocuments ?? config.ragDocuments,
        isActive: isActive ?? config.isActive,
        updatedAt: new Date(),
      })
      .where(eq(agentConfig.id, agentId))
      .returning();

    console.log("✅ Agent configuration updated:", agentId);

    return NextResponse.json({
      success: true,
      agent: updatedConfig,
    });
  } catch (error) {
    console.error("❌ Failed to save agent config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

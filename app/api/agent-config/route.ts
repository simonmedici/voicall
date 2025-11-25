import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET - Fetch agent config for current user
export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch agent config
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        config: {
          name: "Praxis-Assistent",
          firstMessage: "Guten Tag, wie kann ich Ihnen helfen?",
          voiceId: null,
          language: "de",
          systemPrompt: "",
          isActive: false,
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching agent config:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent config" },
      { status: 500 }
    );
  }
}

// PATCH - Update agent config
export async function PATCH(request: NextRequest) {
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
      name,
      firstMessage,
      voiceId,
      systemPrompt,
      language,
      llmModel,
      temperature,
      maxTokens,
    } = body;

    // Validate first message length
    if (firstMessage && firstMessage.length > 500) {
      return NextResponse.json(
        { error: "First message must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (firstMessage !== undefined) updateData.firstMessage = firstMessage;
    if (voiceId !== undefined) updateData.voiceId = voiceId;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (language !== undefined) updateData.language = language;
    if (llmModel !== undefined) updateData.llmModel = llmModel;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;

    if (existingConfig) {
      // Update existing config in DB
      const [updated] = await db
        .update(agentConfig)
        .set(updateData)
        .where(eq(agentConfig.userId, session.user.id))
        .returning();

      // Sync to ElevenLabs if agent ID exists
      if (updated.elevenLabsAgentId) {
        const { updateAgent } = await import("@/lib/elevenlabs");

        try {
          await updateAgent(updated.elevenLabsAgentId, {
            name: updated.name || undefined,
            systemPrompt: updated.systemPrompt || undefined,
            firstMessage: updated.firstMessage || undefined,
            voiceId: updated.voiceId || undefined,
            language: updated.language || undefined,
            llmModel: updated.llmModel || undefined,
            temperature: updated.temperature ?? undefined,
            maxTokens: updated.maxTokens ?? undefined,
          });
          console.log("Successfully synced config to ElevenLabs");
        } catch (syncError) {
          console.warn("Failed to sync to ElevenLabs:", syncError);
        }
      }

      return NextResponse.json({ config: updated });
    } else {
      // Create new config (without ElevenLabs agent - use /api/agents/create for that)
      const [created] = await db
        .insert(agentConfig)
        .values({
          id: randomUUID(),
          userId: session.user.id,
          elevenLabsAgentId: "",
          name: name || "Praxis-Assistent",
          voiceId: voiceId || "default",
          systemPrompt:
            systemPrompt ||
            "Du bist ein freundlicher Telefonassistent für eine Schweizer Arztpraxis.",
          firstMessage: firstMessage || "Guten Tag, wie kann ich Ihnen helfen?",
          language: language || "de",
          llmModel: llmModel || "gpt-4o",
          temperature: temperature ?? 1.0,
          maxTokens: maxTokens ?? -1,
          isActive: false,
        })
        .returning();

      return NextResponse.json({ config: created });
    }
  } catch (error) {
    console.error("Error updating agent config:", error);
    return NextResponse.json(
      { error: "Failed to update agent config" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig, subscription } from "@/lib/db/schema";
import { createAgent } from "@/lib/elevenlabs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * POST /api/agents/create - Create a new agent
 * Based on: https://elevenlabs.io/docs/api-reference/create-agent
 */
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

    // Check subscription tier & agent limits
    const [userSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    if (!userSub) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 403 }
      );
    }

    // Count existing agents
    const existingAgents = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id));

    // Check limits
    const limits = {
      starter: 1,
      pro: 3,
      enterprise: -1, // unlimited
    };

    const maxAgents = limits[userSub.tier as keyof typeof limits] || 1;

    if (maxAgents !== -1 && existingAgents.length >= maxAgents) {
      return NextResponse.json(
        {
          error: `Agent limit reached. Your ${userSub.tier} plan allows ${maxAgents} agent(s). Upgrade to create more.`,
        },
        { status: 403 }
      );
    }

    // Parse request body
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

    // Validate required fields (per ElevenLabs docs)
    if (!name || !voiceId || !systemPrompt || !firstMessage || !language) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, voiceId, systemPrompt, firstMessage, language",
        },
        { status: 400 }
      );
    }

    // Create agent in ElevenLabs
    const result = await createAgent({
      name,
      voiceId,
      systemPrompt,
      firstMessage,
      language,
      llmModel,
      temperature,
      maxTokens,
    });

    // Save to database
    const agentId = randomUUID();

    await db.insert(agentConfig).values({
      id: agentId,
      userId: session.user.id,
      elevenLabsAgentId: result.agentId,
      name,
      voiceId,
      systemPrompt,
      firstMessage,
      language,
      llmModel: llmModel || "gpt-4o",
      temperature: temperature ?? 1.0,
      maxTokens: maxTokens ?? -1,
      isActive: true,
    });

    console.log("✅ Agent created and saved to DB:", agentId);

    return NextResponse.json({
      success: true,
      agentId,
      elevenLabsAgentId: result.agentId,
    });
  } catch (error) {
    console.error("❌ Failed to create agent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create agent",
      },
      { status: 500 }
    );
  }
}

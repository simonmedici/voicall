import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig, subscription } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { createAgent } from "@/lib/elevenlabs";
import { randomUUID } from "crypto";

/**
 * POST /api/agent/create - Create a new agent
 * Allows users to create their own conversational agents with full configuration
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
    } = body;

    // Validation
    if (!name || !voiceId || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: name, voiceId, systemPrompt" },
        { status: 400 }
      );
    }

    // Get user's subscription to check tier limits
    const userSubscriptionResult = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    const userSubscription = userSubscriptionResult[0] || null;

    // Check how many agents user already has
    const agentCountResult = await db
      .select({ count: count() })
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id));

    const currentAgentCount = agentCountResult[0]?.count || 0;

    // Subscription tier limits
    const tierLimits: Record<
      string,
      { maxAgents: number; ragEnabled: boolean }
    > = {
      starter: { maxAgents: 1, ragEnabled: false },
      pro: { maxAgents: 3, ragEnabled: true },
      enterprise: { maxAgents: -1, ragEnabled: true }, // -1 = unlimited
    };

    const userTier = userSubscription?.tier || "starter";
    const limits = tierLimits[userTier] || tierLimits.starter;

    // Check agent limit
    if (limits.maxAgents !== -1 && currentAgentCount >= limits.maxAgents) {
      console.log(
        `❌ Agent limit reached: ${currentAgentCount}/${limits.maxAgents} for tier ${userTier}`
      );
      return NextResponse.json(
        {
          error: `Your ${userTier} plan allows maximum ${limits.maxAgents} agent(s). Please upgrade to create more agents.`,
        },
        { status: 403 }
      );
    }

    // Check RAG feature access
    if (enableRag && !limits.ragEnabled) {
      console.log(`❌ RAG not allowed for tier ${userTier}`);
      return NextResponse.json(
        {
          error:
            "Knowledge Base (RAG) is only available for Pro and Enterprise plans. Please upgrade your subscription.",
        },
        { status: 403 }
      );
    }

    console.log(
      `✅ Subscription check passed: ${userTier} tier, ${currentAgentCount}/${limits.maxAgents} agents`
    );

    // Create agent in ElevenLabs
    console.log("🚀 Creating agent for user:", session.user.id);
    const result = await createAgent({
      name,
      voiceId,
      systemPrompt,
      language: language || "de",
      additionalLanguages: additionalLanguages || [],
      firstMessage: greetingMessage || "Hallo! Wie kann ich Ihnen helfen?",
      disableFirstMessageInterruptions:
        disableFirstMessageInterruptions || false,
      llmModel: llmModel || "gpt-4o-mini",
      llmTemperature: llmTemperature ?? 0.7,
      maxTokens: maxTokens ?? -1,
      turnTimeout: turnTimeout || 7,
      turnEagerness: turnEagerness || "normal",
      enableInterruptions: enableInterruptions !== false,
      maxDuration: maxDuration || 600,
      dynamicVariables: dynamicVariables || {},
      ragDocuments: ragDocuments || [],
      enableRag: enableRag || false,
    });

    if (!result.success || !result.agentId) {
      console.error("❌ Failed to create agent:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to create agent in ElevenLabs" },
        { status: 500 }
      );
    }

    // Save configuration to database
    const configId = randomUUID();
    const [config] = await db
      .insert(agentConfig)
      .values({
        id: configId,
        userId: session.user.id,
        name,
        elevenLabsAgentId: result.agentId,
        voiceId,
        voiceName: voiceName || null,
        systemPrompt,
        greetingMessage: greetingMessage || "Hallo! Wie kann ich Ihnen helfen?",
        language: language || "de",
        additionalLanguages: additionalLanguages || [],
        llmModel: llmModel || "gpt-4o-mini",
        llmTemperature: llmTemperature ?? 0.7,
        maxTokens: maxTokens ?? -1,
        turnTimeout: turnTimeout || 7,
        turnEagerness: turnEagerness || "normal",
        enableInterruptions: enableInterruptions !== false,
        disableFirstMessageInterruptions:
          disableFirstMessageInterruptions || false,
        maxDuration: maxDuration || 600,
        dynamicVariables: dynamicVariables || null,
        enableRag: enableRag || false,
        ragDocuments: ragDocuments || null,
        isActive: false, // Agents start inactive, user must activate
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("✅ Agent created successfully:", config.id);

    return NextResponse.json({
      success: true,
      agent: {
        id: config.id,
        name: config.name,
        elevenLabsAgentId: config.elevenLabsAgentId,
        language: config.language,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Error creating agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

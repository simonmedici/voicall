import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig, user } from "@/lib/db/schema";
import { createAgent } from "@/lib/elevenlabs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * POST /api/agents/create - Create a new agent (ADMIN ONLY)
 * Based on: https://elevenlabs.io/docs/api-reference/create-agent
 * 
 * Note: Only admins can create agents. Agents are then assigned to users
 * via the admin panel using /api/admin/assign-agent
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

    // Check if user is admin
    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only admins can create agents" },
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

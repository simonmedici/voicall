import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAgent } from "@/lib/elevenlabs";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser[0]?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, agentId } = body;

    if (!userId || !agentId) {
      return NextResponse.json(
        { error: "User ID and Agent ID are required" },
        { status: 400 }
      );
    }

    const targetUser = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const agentDetails = await getAgent(agentId);

    if (!agentDetails) {
      return NextResponse.json(
        { error: "Agent not found in ElevenLabs" },
        { status: 404 }
      );
    }

    const existingConfig = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.elevenLabsAgentId, agentId))
      .limit(1);

    if (existingConfig.length > 0) {
      return NextResponse.json(
        { error: "Dieser Agent ist bereits einem Benutzer zugewiesen" },
        { status: 400 }
      );
    }

    const conversationConfig = agentDetails.conversation_config || {};
    const agentConf = conversationConfig.agent || {};
    const ttsConf = conversationConfig.tts || {};

    await db.insert(agentConfig).values({
      id: randomUUID(),
      userId: userId,
      elevenLabsAgentId: agentId,
      name: agentDetails.name || "Unnamed Agent",
      voiceId: ttsConf.voice_id || "",
      systemPrompt: agentConf.prompt?.prompt || "",
      firstMessage: agentConf.first_message || "",
      language: agentConf.language || "de",
      llmModel: agentConf.prompt?.llm || "gpt-4o",
      temperature: agentConf.prompt?.temperature ?? 1.0,
      maxTokens: agentConf.prompt?.max_tokens ?? -1,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Agent "${agentDetails.name}" wurde ${targetUser[0].email} zugewiesen`,
    });
  } catch (error) {
    console.error("Error assigning agent:", error);
    return NextResponse.json(
      { error: "Failed to assign agent" },
      { status: 500 }
    );
  }
}

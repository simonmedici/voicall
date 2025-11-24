import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/agent/save - Save or update agent configuration
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

    const body = await request.json();
    const {
      elevenLabsAgentId,
      voiceId,
      voiceName,
      systemPrompt,
      greetingMessage,
      language,
      phoneNumber,
      isActive,
    } = body;

    // Check if config exists
    const existingConfig = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    const configData = {
      userId: session.user.id,
      elevenLabsAgentId:
        elevenLabsAgentId || existingConfig[0]?.elevenLabsAgentId,
      voiceId: voiceId || existingConfig[0]?.voiceId,
      voiceName: voiceName || existingConfig[0]?.voiceName,
      systemPrompt: systemPrompt || existingConfig[0]?.systemPrompt,
      greetingMessage: greetingMessage || existingConfig[0]?.greetingMessage,
      language: language || existingConfig[0]?.language || "de",
      phoneNumber: phoneNumber || existingConfig[0]?.phoneNumber,
      isActive:
        isActive !== undefined
          ? isActive
          : existingConfig[0]?.isActive || false,
      updatedAt: new Date(),
    };

    if (existingConfig.length === 0) {
      // Create new config
      const [newConfig] = await db
        .insert(agentConfig)
        .values({
          id: crypto.randomUUID(),
          ...configData,
          createdAt: new Date(),
        })
        .returning();

      return NextResponse.json(newConfig, { status: 201 });
    } else {
      // Update existing config
      const [updatedConfig] = await db
        .update(agentConfig)
        .set(configData)
        .where(eq(agentConfig.userId, session.user.id))
        .returning();

      return NextResponse.json(updatedConfig);
    }
  } catch (error) {
    console.error("Failed to save agent config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

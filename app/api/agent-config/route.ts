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
          greetingMessage: "Guten Tag, wie kann ich Ihnen helfen?",
          voiceId: null,
          voiceName: null,
          enabledLanguages: ["de"],
          ragDocuments: null,
          phoneNumber: null,
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
      greetingMessage,
      voiceId,
      voiceName,
      enabledLanguages,
      ragDocuments,
      systemPrompt,
      language,
    } = body;

    // Validate greeting message length
    if (greetingMessage && greetingMessage.length > 200) {
      return NextResponse.json(
        { error: "Greeting message must be 200 characters or less" },
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

    if (greetingMessage !== undefined)
      updateData.greetingMessage = greetingMessage;
    if (voiceId !== undefined) updateData.voiceId = voiceId;
    if (voiceName !== undefined) updateData.voiceName = voiceName;
    if (enabledLanguages !== undefined)
      updateData.enabledLanguages = enabledLanguages;
    if (ragDocuments !== undefined) updateData.ragDocuments = ragDocuments;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (language !== undefined) updateData.language = language;

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

        const syncResult = await updateAgent(updated.elevenLabsAgentId, {
          systemPrompt: updated.systemPrompt || undefined,
          firstMessage: updated.greetingMessage || undefined,
          voiceId: updated.voiceId || undefined,
          language: updated.language || undefined,
        });

        if (!syncResult.success) {
          console.warn("Failed to sync to ElevenLabs:", syncResult.error);
          // Don't fail the request, just log the warning
        } else {
          console.log("Successfully synced config to ElevenLabs");
        }
      }

      return NextResponse.json({ config: updated });
    } else {
      // Create new config
      const [created] = await db
        .insert(agentConfig)
        .values({
          id: randomUUID(),
          userId: session.user.id,
          greetingMessage:
            greetingMessage || "Guten Tag, wie kann ich Ihnen helfen?",
          voiceId: voiceId || null,
          voiceName: voiceName || null,
          systemPrompt:
            systemPrompt ||
            "Du bist ein freundlicher Telefonassistent für eine Schweizer Arztpraxis. Du sprichst Schweizerdeutsch und hilfst Patienten bei Terminvereinbarungen und allgemeinen Anfragen.",
          language: language || "de",
          enabledLanguages: enabledLanguages || ["de"],
          ragDocuments: ragDocuments || null,
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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/agent/test-call - Initiate a test call with the agent
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
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get user's agent config
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, session.user.id))
      .limit(1);

    if (!config?.elevenLabsAgentId) {
      return NextResponse.json(
        { error: "No agent configured. Please contact admin." },
        { status: 404 }
      );
    }

    if (!config.isActive) {
      return NextResponse.json(
        { error: "Agent is not active" },
        { status: 400 }
      );
    }

    // Initiate call via ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${config.elevenLabsAgentId}/call`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to initiate call:", error);
      return NextResponse.json(
        { error: "Failed to initiate call" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      conversationId: data.conversation_id,
      message: "Test call initiated successfully",
    });
  } catch (error) {
    console.error("Error initiating test call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

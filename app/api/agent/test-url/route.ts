import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAgentTestUrl } from "@/lib/elevenlabs";

/**
 * GET /api/agent/test-url - Generate signed URL for browser-based agent testing
 * Returns a URL that can be used in an iframe or new window for testing
 */
export async function GET(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId parameter" },
        { status: 400 }
      );
    }

    // Get agent config to verify ownership
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
        { error: "Agent not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    if (!config.elevenLabsAgentId) {
      return NextResponse.json(
        { error: "Agent not fully configured" },
        { status: 400 }
      );
    }

    // Generate signed URL from ElevenLabs
    const result = await getAgentTestUrl(
      config.elevenLabsAgentId,
      config.dynamicVariables as Record<string, string> | undefined
    );

    if (!result.success || !result.signedUrl) {
      return NextResponse.json(
        { error: result.error || "Failed to generate test URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      agentName: config.name,
    });
  } catch (error) {
    console.error("❌ Error generating test URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

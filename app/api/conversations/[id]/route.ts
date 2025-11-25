import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getConversation, extractCallData } from "@/lib/elevenlabs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    const conversation = await getConversation(conversationId);

    const userAgents = await db
      .select({
        elevenLabsAgentId: agentConfig.elevenLabsAgentId,
        name: agentConfig.name,
      })
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId));

    const agentIds = userAgents.map((a) => a.elevenLabsAgentId);

    if (!agentIds.includes(conversation.agent_id)) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const agentName =
      userAgents.find((a) => a.elevenLabsAgentId === conversation.agent_id)
        ?.name || "Unbekannter Agent";

    const extractedData = extractCallData(conversation.transcript);

    return NextResponse.json({
      ...conversation,
      agentName,
      extractedData,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

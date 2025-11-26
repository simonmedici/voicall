import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getConversation, listConversations, extractCallData } from "@/lib/elevenlabs";

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

    const userAgents = await db
      .select({
        elevenLabsAgentId: agentConfig.elevenLabsAgentId,
        name: agentConfig.name,
      })
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId));

    if (userAgents.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const agentIds = userAgents.map((a) => a.elevenLabsAgentId);

    let conversationAgentId: string | null = null;
    for (const agentId of agentIds) {
      try {
        const result = await listConversations(agentId, { pageSize: 100 });
        const found = result.conversations.find(
          (c) => c.conversation_id === conversationId
        );
        if (found) {
          conversationAgentId = agentId;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!conversationAgentId) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conversation = await getConversation(conversationId);

    const agentName =
      userAgents.find((a) => a.elevenLabsAgentId === conversationAgentId)
        ?.name || "Unbekannter Agent";

    const transcript = conversation.transcript || [];
    const extractedData = extractCallData(transcript);

    const metadata = conversation.metadata as Record<string, unknown> | undefined;
    const startTime = metadata?.start_time_unix_secs as number | undefined;
    const callDuration = metadata?.call_duration_secs as number | undefined;

    const response = {
      conversation_id: conversation.conversation_id,
      agent_id: conversation.agent_id,
      status: conversation.status,
      start_time_unix_secs: startTime,
      call_duration_secs: callDuration,
      transcript,
      metadata: conversation.metadata,
      analysis: conversation.analysis,
      agentName,
      extractedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

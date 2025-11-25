import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listConversations, type Conversation } from "@/lib/elevenlabs";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const userAgents = await db
      .select({
        elevenLabsAgentId: agentConfig.elevenLabsAgentId,
        name: agentConfig.name,
      })
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId));

    if (userAgents.length === 0) {
      return NextResponse.json({
        conversations: [],
        agentMap: {},
      });
    }

    const agentMap: Record<string, string> = {};
    userAgents.forEach((agent) => {
      agentMap[agent.elevenLabsAgentId] = agent.name;
    });

    const allConversations: Conversation[] = [];

    for (const agent of userAgents) {
      try {
        const result = await listConversations(agent.elevenLabsAgentId, {
          pageSize: 100,
        });
        allConversations.push(...result.conversations);
      } catch (error) {
        console.error(
          `Failed to fetch conversations for agent ${agent.elevenLabsAgentId}:`,
          error
        );
      }
    }

    allConversations.sort(
      (a, b) => b.start_time_unix_secs - a.start_time_unix_secs
    );

    return NextResponse.json({
      conversations: allConversations,
      agentMap,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

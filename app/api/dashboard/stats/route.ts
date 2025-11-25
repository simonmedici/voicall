import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { call, agentConfig } from "@/lib/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";

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
      .select({ elevenLabsAgentId: agentConfig.elevenLabsAgentId })
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId));

    const agentIds = userAgents.map((a) => a.elevenLabsAgentId);

    if (agentIds.length === 0) {
      return NextResponse.json({
        totalCalls: 0,
        callsToday: 0,
        minutesUsedThisMonth: 0,
        successRate: 0,
        recentCalls: [],
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalCallsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(call)
      .where(inArray(call.agentId, agentIds));

    const [callsTodayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(call)
      .where(
        and(
          inArray(call.agentId, agentIds),
          gte(call.createdAt, today)
        )
      );

    const [minutesResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(minutes_charged), 0)::real` 
      })
      .from(call)
      .where(
        and(
          inArray(call.agentId, agentIds),
          gte(call.createdAt, firstDayOfMonth)
        )
      );

    const [successResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        successful: sql<number>`SUM(CASE WHEN call_successful = true THEN 1 ELSE 0 END)::int`,
      })
      .from(call)
      .where(inArray(call.agentId, agentIds));

    const totalCalls = totalCallsResult?.count || 0;
    const callsToday = callsTodayResult?.count || 0;
    const minutesUsedThisMonth = Math.round((minutesResult?.total || 0) * 10) / 10;
    
    const successRate = successResult?.total > 0
      ? Math.round((successResult.successful / successResult.total) * 100)
      : 0;

    const recentCalls = await db
      .select({
        id: call.id,
        conversationId: call.conversationId,
        agentId: call.agentId,
        status: call.status,
        durationSecs: call.durationSecs,
        callSuccessful: call.callSuccessful,
        createdAt: call.createdAt,
      })
      .from(call)
      .where(inArray(call.agentId, agentIds))
      .orderBy(sql`${call.createdAt} DESC`)
      .limit(5);

    return NextResponse.json({
      totalCalls,
      callsToday,
      minutesUsedThisMonth,
      successRate,
      recentCalls,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

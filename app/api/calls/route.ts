import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { call } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build query
    const baseConditions = [eq(call.userId, session.user.id)];

    // Apply status filter if provided
    if (status) {
      baseConditions.push(eq(call.status, status));
    }

    const calls = await db
      .select()
      .from(call)
      .where(and(...baseConditions))
      .orderBy(desc(call.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Anrufe" },
      { status: 500 }
    );
  }
}

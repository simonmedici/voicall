import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { call } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get call details
    const [callData] = await db
      .select()
      .from(call)
      .where(
        and(
          eq(call.id, id),
          eq(call.userId, session.user.id) // Ensure user owns this call
        )
      )
      .limit(1);

    if (!callData) {
      return NextResponse.json(
        { error: "Anruf nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ call: callData });
  } catch (error) {
    console.error("Error fetching call:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Anrufs" },
      { status: 500 }
    );
  }
}

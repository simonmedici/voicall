import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { hasActiveSubscription: false, error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    const hasActiveSubscription = sub && sub.status === "active";

    return NextResponse.json({
      hasActiveSubscription,
      tier: sub?.tier ?? null,
      status: sub?.status ?? null,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { hasActiveSubscription: false, error: "Fehler beim Prüfen" },
      { status: 500 }
    );
  }
}

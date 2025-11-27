import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ isAdmin: false });
    }

    const [userData] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json({ isAdmin: userData?.isAdmin ?? false });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}

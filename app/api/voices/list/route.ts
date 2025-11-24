import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listVoices } from "@/lib/elevenlabs";

/**
 * GET /api/voices/list - Get all available ElevenLabs voices
 * Requires authentication
 */
export async function GET() {
  try {
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await listVoices();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch voices" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      voices: result.voices,
      total: result.voices.length,
    });
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

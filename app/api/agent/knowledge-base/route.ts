import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { agentConfig, subscription } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { addKnowledgeBaseUrl, updateAgent } from "@/lib/elevenlabs";

/**
 * POST /api/agent/knowledge-base - Add a knowledge base document from URL
 * Updates the agent with the new document for RAG
 */
export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, url, name } = body;

    if (!agentId || !url || !name) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, url, name" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
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
        { error: "Agent not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Check if user has RAG access
    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id))
      .limit(1);

    const userTier = userSubscription?.tier || "starter";
    const ragEnabled = userTier === "pro" || userTier === "enterprise";

    if (!ragEnabled) {
      return NextResponse.json(
        {
          error:
            "Knowledge Base (RAG) is only available for Pro and Enterprise plans. Please upgrade your subscription.",
        },
        { status: 403 }
      );
    }

    // Add document to ElevenLabs knowledge base
    const result = await addKnowledgeBaseUrl(url, name);

    if (!result.success || !result.documentId) {
      return NextResponse.json(
        { error: result.error || "Failed to add document to knowledge base" },
        { status: 500 }
      );
    }

    // Update agent config in database
    const existingDocs =
      (config.ragDocuments as Array<{
        id: string;
        name: string;
        url: string;
        type: string;
        uploadedAt: string;
      }>) || [];

    const newDoc = {
      id: result.documentId,
      name,
      url,
      type: "url",
      uploadedAt: new Date().toISOString(),
    };

    const updatedDocs = [...existingDocs, newDoc];

    await db
      .update(agentConfig)
      .set({
        ragDocuments: updatedDocs,
        enableRag: true,
        updatedAt: new Date(),
      })
      .where(eq(agentConfig.id, agentId));

    // Update ElevenLabs agent to include the new document
    if (config.elevenLabsAgentId) {
      await updateAgent(config.elevenLabsAgentId, {
        name: config.name,
        voiceId: config.voiceId || "",
        systemPrompt: config.systemPrompt,
        language: config.language,
        firstMessage: config.greetingMessage,
        ragDocuments: updatedDocs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type as "url" | "file" | "text",
        })),
        enableRag: true,
      });
    }

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: "Document added to knowledge base successfully",
    });
  } catch (error) {
    console.error("❌ Error adding knowledge base document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/knowledge-base - Remove a knowledge base document
 */
export async function DELETE(request: NextRequest) {
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
    const documentId = searchParams.get("documentId");

    if (!agentId || !documentId) {
      return NextResponse.json(
        { error: "Missing required parameters: agentId, documentId" },
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
        { error: "Agent not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Remove document from database
    const existingDocs =
      (config.ragDocuments as Array<{
        id: string;
        name: string;
        url: string;
        type: string;
        uploadedAt: string;
      }>) || [];

    const updatedDocs = existingDocs.filter((doc) => doc.id !== documentId);

    await db
      .update(agentConfig)
      .set({
        ragDocuments: updatedDocs,
        enableRag: updatedDocs.length > 0,
        updatedAt: new Date(),
      })
      .where(eq(agentConfig.id, agentId));

    // Update ElevenLabs agent
    if (config.elevenLabsAgentId) {
      await updateAgent(config.elevenLabsAgentId, {
        name: config.name,
        voiceId: config.voiceId || "",
        systemPrompt: config.systemPrompt,
        language: config.language,
        firstMessage: config.greetingMessage,
        ragDocuments: updatedDocs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type as "url" | "file" | "text",
        })),
        enableRag: updatedDocs.length > 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Document removed from knowledge base successfully",
    });
  } catch (error) {
    console.error("❌ Error removing knowledge base document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

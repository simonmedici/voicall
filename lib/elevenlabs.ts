import crypto from "crypto";

// ============================================
// ELEVENLABS API - Rebuilt from Documentation
// https://elevenlabs.io/docs/api-reference/
// ============================================

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

if (!ELEVENLABS_API_KEY) {
  console.warn("⚠️ ELEVENLABS_API_KEY not set");
}

/**
 * Voice interface from ElevenLabs API
 */
export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

/**
 * Agent configuration interface
 * Based on: https://elevenlabs.io/docs/api-reference/create-agent
 */
export interface AgentConfig {
  name: string;
  voiceId: string;
  systemPrompt: string;
  firstMessage: string; // REQUIRED by ElevenLabs!
  language: string;
  llmModel?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Create a new conversational agent
 * Documentation: https://elevenlabs.io/docs/api-reference/create-agent
 */
export async function createAgent(config: AgentConfig) {
  console.log("📤 Creating agent in ElevenLabs:", config.name);

  const payload = {
    name: config.name,
    conversation_config: {
      agent: {
        prompt: {
          prompt: config.systemPrompt,
          llm: config.llmModel || "gpt-4o",
          temperature: config.temperature ?? 1.0,
          max_tokens: config.maxTokens ?? -1,
        },
        first_message: config.firstMessage, // REQUIRED!
        language: config.language,
      },
      tts: {
        voice_id: config.voiceId,
        model_id: "eleven_turbo_v2_5",
      },
    },
    platform_settings: {
      auth: {
        enable_auth: false, // Public agent for widget
      },
    },
  };

  console.log("📋 Payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("❌ ElevenLabs API Error:", error);
    throw new Error(
      `Failed to create agent: ${error.detail || response.statusText}`
    );
  }

  const data = await response.json();
  console.log("✅ Agent created:", data.agent_id);

  return {
    agentId: data.agent_id,
  };
}

/**
 * Update an existing agent
 * Documentation: https://elevenlabs.io/docs/api-reference/update-agent
 */
export async function updateAgent(
  agentId: string,
  config: Partial<AgentConfig>
) {
  console.log(`🔄 Updating agent: ${agentId}`);

  const payload: Record<string, unknown> = {};

  // Top-level fields
  if (config.name) {
    payload.name = config.name;
  }

  // Conversation config
  const conversationConfig: Record<string, unknown> = {};

  // Agent prompt settings
  if (
    config.systemPrompt ||
    config.llmModel ||
    config.temperature !== undefined ||
    config.maxTokens
  ) {
    const agentPrompt: Record<string, unknown> = {};

    if (config.systemPrompt) agentPrompt.prompt = config.systemPrompt;
    if (config.llmModel) agentPrompt.llm = config.llmModel;
    if (config.temperature !== undefined)
      agentPrompt.temperature = config.temperature;
    if (config.maxTokens) agentPrompt.max_tokens = config.maxTokens;

    conversationConfig.agent = { prompt: agentPrompt };
  }

  // First message & language
  if (config.firstMessage) {
    if (!conversationConfig.agent) {
      conversationConfig.agent = {};
    }
    (conversationConfig.agent as Record<string, unknown>).first_message =
      config.firstMessage;
  }

  if (config.language) {
    if (!conversationConfig.agent) {
      conversationConfig.agent = {};
    }
    (conversationConfig.agent as Record<string, unknown>).language =
      config.language;
  }

  // Voice settings
  if (config.voiceId) {
    conversationConfig.tts = {
      voice_id: config.voiceId,
      model_id: "eleven_turbo_v2_5",
    };
  }

  if (Object.keys(conversationConfig).length > 0) {
    payload.conversation_config = conversationConfig;
  }

  console.log("📋 Update payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("❌ Update failed:", error);
    throw new Error(
      `Failed to update agent: ${error.detail || response.statusText}`
    );
  }

  const data = await response.json();
  console.log("✅ Agent updated");

  return data;
}

/**
 * Delete an agent
 * Documentation: https://elevenlabs.io/docs/api-reference/delete-agent
 */
export async function deleteAgent(agentId: string) {
  console.log(`🗑️ Deleting agent: ${agentId}`);

  const response = await fetch(`${BASE_URL}/convai/agents/${agentId}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY || "",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("❌ Delete failed:", error);
    throw new Error(
      `Failed to delete agent: ${error.detail || response.statusText}`
    );
  }

  console.log("✅ Agent deleted");
  return true;
}

/**
 * Get agent details
 * Documentation: https://elevenlabs.io/docs/api-reference/get-agent
 */
export async function getAgent(agentId: string) {
  const response = await fetch(`${BASE_URL}/convai/agents/${agentId}`, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY || "",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to get agent: ${error.detail || response.statusText}`
    );
  }

  return await response.json();
}

/**
 * List all available voices
 * Documentation: https://elevenlabs.io/docs/api-reference/get-voices
 */
export async function listVoices(): Promise<
  { success: true; voices: Voice[] } | { success: false; error: string }
> {
  try {
    const response = await fetch(`${BASE_URL}/voices`, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.detail || "Failed to fetch voices",
      };
    }

    const data = await response.json();
    return { success: true, voices: data.voices || [] };
  } catch (error) {
    console.error("❌ Failed to fetch voices:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch voices",
    };
  }
}

/**
 * List conversations for an agent
 * Documentation: https://elevenlabs.io/docs/api-reference/get-conversations
 */
export async function listConversations(
  agentId?: string,
  options?: {
    cursor?: string;
    pageSize?: number;
    callSuccessful?: "success" | "failure" | "unknown";
    search?: string;
  }
) {
  const params = new URLSearchParams();
  if (agentId) params.append("agent_id", agentId);
  if (options?.cursor) params.append("cursor", options.cursor);
  if (options?.pageSize)
    params.append("page_size", options.pageSize.toString());
  if (options?.callSuccessful)
    params.append("call_successful", options.callSuccessful);
  if (options?.search) params.append("search", options.search);

  const response = await fetch(
    `${BASE_URL}/convai/conversations?${params.toString()}`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to list conversations: ${error.detail || response.statusText}`
    );
  }

  const data = await response.json();
  return {
    conversations: data.conversations,
    hasMore: data.has_more,
    nextCursor: data.next_cursor,
  };
}

/**
 * Verify ElevenLabs webhook signature
 * Documentation: https://elevenlabs.io/docs/conversational-ai/webhooks
 */
export function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

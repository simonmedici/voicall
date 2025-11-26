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
 * ElevenLabs Agent from list API
 */
export interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  created_at_unix_secs?: number;
  conversation_config?: {
    agent?: {
      first_message?: string;
      language?: string;
    };
    tts?: {
      voice_id?: string;
    };
  };
}

/**
 * List all agents in ElevenLabs account
 * Documentation: https://elevenlabs.io/docs/api-reference/agents/list
 */
export async function listAllAgents(options?: {
  pageSize?: number;
  cursor?: string;
  name?: string;
}): Promise<{
  agents: ElevenLabsAgent[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const params = new URLSearchParams();
  if (options?.pageSize) params.append("page_size", options.pageSize.toString());
  if (options?.cursor) params.append("cursor", options.cursor);
  if (options?.name) params.append("name", options.name);

  const response = await fetch(
    `${BASE_URL}/convai/agents?${params.toString()}`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to list agents: ${error.detail || response.statusText}`
    );
  }

  const data = await response.json();
  return {
    agents: data.agents || [],
    hasMore: data.has_more || false,
    nextCursor: data.next_cursor,
  };
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
 * Conversation interface from ElevenLabs API
 */
export interface Conversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  call_successful: string;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation detail interface from ElevenLabs API
 */
export interface ConversationDetail {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  transcript: Array<{
    role: "user" | "agent";
    message: string;
    time_in_call_secs?: number;
  }>;
  metadata?: Record<string, unknown>;
  analysis?: {
    call_successful?: string;
    transcript_summary?: string;
    data_collection_results?: Record<string, unknown>;
    evaluation_criteria_results?: Record<string, unknown>;
  };
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
): Promise<{
  conversations: Conversation[];
  hasMore: boolean;
  nextCursor?: string;
}> {
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
    conversations: data.conversations || [],
    hasMore: data.has_more || false,
    nextCursor: data.next_cursor,
  };
}

/**
 * Get conversation details
 * Documentation: https://elevenlabs.io/docs/api-reference/get-conversation
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationDetail> {
  const response = await fetch(
    `${BASE_URL}/convai/conversations/${conversationId}`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to get conversation: ${error.detail || response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Verify ElevenLabs webhook signature
 * Documentation: https://elevenlabs.io/docs/conversational-ai/webhooks
 */
export function verifyElevenLabsSignature(
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

/**
 * Transcript message interface from ElevenLabs webhook
 */
interface TranscriptMessage {
  role: "user" | "agent";
  message: string;
  time_in_call_secs?: number;
}

/**
 * Extracted call data interface
 */
export interface ExtractedCallData {
  callerName?: string;
  callerPhone?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentReason?: string;
  notes?: string;
  summary?: string;
}

/**
 * Extract structured data from conversation transcript
 * Parses the transcript to find relevant information like names, dates, etc.
 */
export function extractCallData(
  transcript: TranscriptMessage[] | null | undefined
): ExtractedCallData | null {
  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return null;
  }

  const extractedData: ExtractedCallData = {};

  // Combine all messages for analysis
  const fullText = transcript
    .map((msg) => `${msg.role}: ${msg.message}`)
    .join("\n");

  // Extract caller name patterns (common patterns in German/English)
  const namePatterns = [
    /(?:mein name ist|ich bin|ich heiße|my name is|i am|this is)\s+([A-ZÄÖÜa-zäöüß]+(?:\s+[A-ZÄÖÜa-zäöüß]+)?)/i,
    /(?:name[:\s]+)([A-ZÄÖÜa-zäöüß]+(?:\s+[A-ZÄÖÜa-zäöüß]+)?)/i,
  ];

  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      extractedData.callerName = match[1].trim();
      break;
    }
  }

  // Extract phone number patterns
  const phonePatterns = [
    /(?:telefon|nummer|phone|number|erreichen)[:\s]*([+\d\s\-()]{8,})/i,
    /(\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{2,4})/,
    /(0\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{2,4})/,
  ];

  for (const pattern of phonePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      extractedData.callerPhone = match[1].replace(/\s+/g, " ").trim();
      break;
    }
  }

  // Extract date patterns (German and English formats)
  const datePatterns = [
    /(?:am|on|für|for)\s+(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})/i,
    /(\d{1,2}\.\s*(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember))/i,
    /(\d{1,2}\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))/i,
    /(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ];

  for (const pattern of datePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      extractedData.appointmentDate = match[1].trim();
      break;
    }
  }

  // Extract time patterns
  const timePatterns = [
    /(?:um|at)\s+(\d{1,2}[:\.]?\d{0,2}\s*(?:uhr|h)?)/i,
    /(\d{1,2}:\d{2})\s*(?:uhr|h)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      extractedData.appointmentTime = match[1].trim();
      break;
    }
  }

  // Extract reason/subject patterns
  const reasonPatterns = [
    /(?:grund|reason|wegen|because of|für|for)[:\s]+([^.!?\n]+)/i,
    /(?:termin für|appointment for)[:\s]+([^.!?\n]+)/i,
    /(?:es geht um|it's about)[:\s]+([^.!?\n]+)/i,
  ];

  for (const pattern of reasonPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      extractedData.appointmentReason = match[1].trim();
      break;
    }
  }

  // Create a brief summary from the last few agent messages
  const agentMessages = transcript
    .filter((msg) => msg.role === "agent")
    .slice(-2)
    .map((msg) => msg.message)
    .join(" ");

  if (agentMessages) {
    extractedData.summary =
      agentMessages.length > 200
        ? agentMessages.substring(0, 200) + "..."
        : agentMessages;
  }

  return Object.keys(extractedData).length > 0 ? extractedData : null;
}

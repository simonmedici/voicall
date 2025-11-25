import crypto from "crypto";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Initialize ElevenLabs client with master API key
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

// Default configuration for Swiss medical practice agents
const DEFAULT_CONFIG = {
  language: "de", // German (supports Schweizerdeutsch)
  firstMessage:
    "Grüezi! Ich bin der digitale Assistent der Praxis. Wie kann ich Ihnen helfen?",
  maxDuration: 600, // 10 minutes max call duration
};

/**
 * Agent configuration type
 */
export interface AgentConfig {
  name: string;
  voiceId: string;
  systemPrompt: string;
  language?: string;
  additionalLanguages?: string[];
  firstMessage?: string;
  disableFirstMessageInterruptions?: boolean;
  webhookUrl?: string;
  maxDuration?: number;
  llmModel?: string;
  llmTemperature?: number;
  maxTokens?: number;
  turnTimeout?: number;
  turnEagerness?: "eager" | "normal" | "patient";
  enableInterruptions?: boolean;
  dynamicVariables?: Record<string, string>;
  ragDocuments?: Array<{
    id: string;
    name: string;
    type: "url" | "file" | "text";
  }>;
  enableRag?: boolean;
}

/**
 * Create a new ElevenLabs conversational agent
 */
export async function createAgent(config: AgentConfig) {
  try {
    console.log("🚀 Creating new ElevenLabs agent:", config.name);

    const webhookUrl =
      config.webhookUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://voicall.app"}/api/elevenlabs/webhook`;

    // Build system prompt with multi-language support if needed
    let systemPrompt = config.systemPrompt;
    if (config.additionalLanguages && config.additionalLanguages.length > 0) {
      const languages = [config.language || "de", ...config.additionalLanguages]
        .map((lang) => {
          const langNames: Record<string, string> = {
            de: "Deutsch",
            en: "English",
            fr: "Français",
            it: "Italiano",
            es: "Español",
          };
          return langNames[lang] || lang;
        })
        .join(", ");
      systemPrompt += `\n\n# Sprachen\nDu kannst in folgenden Sprachen kommunizieren: ${languages}. Frage den Anrufer in welcher Sprache er sprechen möchte, falls unklar.`;
    }

    const payload = {
      name: config.name,
      conversation_config: {
        agent: {
          prompt: {
            prompt: systemPrompt,
            llm: config.llmModel || "gpt-4o-mini",
            temperature: config.llmTemperature ?? 0.7,
            max_tokens: config.maxTokens ?? -1,
          },
          first_message: config.firstMessage || DEFAULT_CONFIG.firstMessage,
          language: config.language || DEFAULT_CONFIG.language,
          disable_first_message_interruptions:
            config.disableFirstMessageInterruptions || false,
          ...(config.dynamicVariables && {
            dynamic_variables: {
              dynamic_variable_placeholders: config.dynamicVariables,
            },
          }),
        },
        tts: {
          voice_id: config.voiceId,
          model_id: "eleven_turbo_v2_5",
          optimize_streaming_latency: 3,
        },
        turn: {
          turn_timeout: config.turnTimeout || 7,
          turn_eagerness: config.turnEagerness || "normal",
        },
        conversation: {
          max_duration_seconds:
            config.maxDuration || DEFAULT_CONFIG.maxDuration,
          client_events:
            config.enableInterruptions !== false
              ? ["conversation_initiation_metadata", "interruption"]
              : ["conversation_initiation_metadata"],
        },
        asr: {
          quality: "high" as const,
          provider: "elevenlabs" as const,
        },
      },
      platform_settings: {
        webhook_url: webhookUrl,
        webhook_version: "v2" as const,
        events: [
          "conversation_initiation_metadata",
          "conversation_end",
          "agent_response",
          "user_transcript",
        ],
      },
    };

    // Add RAG configuration if enabled
    if (
      config.enableRag &&
      config.ragDocuments &&
      config.ragDocuments.length > 0
    ) {
      payload.conversation_config.agent.prompt = {
        ...payload.conversation_config.agent.prompt,
        knowledge_base: config.ragDocuments.map((doc) => ({
          type: doc.type,
          name: doc.name,
          id: doc.id,
          usage_mode: "prompt" as const,
        })),
        rag: {
          enabled: true,
          embedding_model: "e5_mistral_7b_instruct" as const,
          max_vector_distance: 0.6,
          max_documents_length: 50000,
          max_retrieved_rag_chunks_count: 20,
        },
      };
    }

    console.log(
      "📤 Sending create request to ElevenLabs:",
      JSON.stringify(payload, null, 2)
    );

    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents/create",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ ElevenLabs API error:", error);
      return {
        agentId: null,
        success: false,
        error: `Failed to create agent: ${error}`,
      };
    }

    const data = await response.json();
    console.log("✅ Agent created successfully:", data.agent_id);

    return {
      agentId: data.agent_id,
      success: true,
    };
  } catch (error) {
    console.error("❌ Failed to create ElevenLabs agent:", error);
    return {
      agentId: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update an existing ElevenLabs agent configuration
 * Updates the agent's prompt, first message, voice settings, and all LLM/conversation parameters
 */
export async function updateAgent(
  agentId: string,
  config: Partial<AgentConfig>
) {
  try {
    console.log("🔄 Updating ElevenLabs agent:", agentId);
    console.log("📝 Config to update:", config);

    // Build conversation_config object
    const conversationConfig: Record<string, any> = {};

    // Voice configuration (TTS)
    if (config.voiceId) {
      conversationConfig.tts = {
        voice_id: config.voiceId,
        model_id: "eleven_turbo_v2_5",
        optimize_streaming_latency: 3,
      };
      console.log("🎤 Updating voice to:", config.voiceId);
    }

    // Agent configuration
    const agentConfigObj: Record<string, any> = {};

    // System prompt with LLM settings
    if (
      config.systemPrompt ||
      config.llmModel ||
      config.llmTemperature !== undefined ||
      config.maxTokens !== undefined
    ) {
      // Build multi-language prompt if needed
      let systemPrompt = config.systemPrompt || "";
      if (
        config.additionalLanguages &&
        config.additionalLanguages.length > 0 &&
        config.language
      ) {
        const languages = [config.language, ...config.additionalLanguages]
          .map((lang) => {
            const langNames: Record<string, string> = {
              de: "Deutsch",
              en: "English",
              fr: "Français",
              it: "Italiano",
              es: "Español",
            };
            return langNames[lang] || lang;
          })
          .join(", ");
        systemPrompt += `\n\n# Sprachen\nDu kannst in folgenden Sprachen kommunizieren: ${languages}. Frage den Anrufer in welcher Sprache er sprechen möchte, falls unklar.`;
      }

      agentConfigObj.prompt = {
        prompt: systemPrompt,
        ...(config.llmModel && { llm: config.llmModel }),
        ...(config.llmTemperature !== undefined && {
          temperature: config.llmTemperature,
        }),
        ...(config.maxTokens !== undefined && { max_tokens: config.maxTokens }),
      };

      // Add RAG configuration if provided
      if (
        config.enableRag &&
        config.ragDocuments &&
        config.ragDocuments.length > 0
      ) {
        agentConfigObj.prompt.knowledge_base = config.ragDocuments.map(
          (doc) => ({
            type: doc.type,
            name: doc.name,
            id: doc.id,
            usage_mode: "prompt" as const,
          })
        );
        agentConfigObj.prompt.rag = {
          enabled: true,
          embedding_model: "e5_mistral_7b_instruct" as const,
          max_vector_distance: 0.6,
          max_documents_length: 50000,
          max_retrieved_rag_chunks_count: 20,
        };
      }
    }

    if (config.firstMessage !== undefined) {
      agentConfigObj.first_message = config.firstMessage;
    }

    if (config.language) {
      agentConfigObj.language = config.language;
    }

    if (config.disableFirstMessageInterruptions !== undefined) {
      agentConfigObj.disable_first_message_interruptions =
        config.disableFirstMessageInterruptions;
    }

    if (config.dynamicVariables) {
      agentConfigObj.dynamic_variables = {
        dynamic_variable_placeholders: config.dynamicVariables,
      };
    }

    if (Object.keys(agentConfigObj).length > 0) {
      conversationConfig.agent = agentConfigObj;
    }

    // Turn configuration
    if (config.turnTimeout !== undefined || config.turnEagerness) {
      conversationConfig.turn = {
        ...(config.turnTimeout !== undefined && {
          turn_timeout: config.turnTimeout,
        }),
        ...(config.turnEagerness && { turn_eagerness: config.turnEagerness }),
      };
    }

    // Conversation configuration
    if (
      config.maxDuration !== undefined ||
      config.enableInterruptions !== undefined
    ) {
      conversationConfig.conversation = {
        ...(config.maxDuration !== undefined && {
          max_duration_seconds: config.maxDuration,
        }),
        ...(config.enableInterruptions !== undefined && {
          client_events: config.enableInterruptions
            ? ["conversation_initiation_metadata", "interruption"]
            : ["conversation_initiation_metadata"],
        }),
      };
    }

    // Only send name if provided (top-level field)
    const updatePayload: Record<string, any> = {
      conversation_config: conversationConfig,
    };

    if (config.name) {
      updatePayload.name = config.name;
    }

    console.log(
      "📤 Sending payload to ElevenLabs:",
      JSON.stringify(updatePayload, null, 2)
    );

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        method: "PATCH",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ ElevenLabs API error:", error);
      return {
        success: false,
        error: `Failed to update agent: ${error}`,
      };
    }

    const data = await response.json();
    console.log("✅ Agent updated successfully:", agentId);

    return {
      success: true,
      agent: data,
    };
  } catch (error) {
    console.error("❌ Failed to update ElevenLabs agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete an ElevenLabs agent
 */
export async function deleteAgent(agentId: string) {
  try {
    console.log("🗑️ Deleting ElevenLabs agent:", agentId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        method: "DELETE",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to delete agent:", error);
      return {
        success: false,
        error: `Failed to delete agent: ${error}`,
      };
    }

    console.log("✅ Agent deleted successfully:", agentId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Failed to delete ElevenLabs agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get agent details and status from ElevenLabs
 */
export async function getAgent(agentId: string) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get agent: ${error}`,
      };
    }

    const agent = await response.json();
    return {
      success: true,
      agent,
    };
  } catch (error) {
    console.error("Failed to get ElevenLabs agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * List all available voices from ElevenLabs
 */
export async function listVoices() {
  try {
    // Use voices.search() for API v2 - it returns all voices by default
    const response = await elevenlabs.voices.search({
      pageSize: 100, // Get up to 100 voices per page
    });

    return {
      success: true,
      voices: response.voices.map((voice) => ({
        voiceId: voice.voiceId, // Use voiceId as the key
        name: voice.name,
        category: voice.category,
        description: voice.description,
        previewUrl: voice.previewUrl,
        labels: voice.labels,
        isOwner: voice.isOwner,
      })),
    };
  } catch (error) {
    console.error("Failed to list voices:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      voices: [],
    };
  }
}

/**
 * Get specific voice details
 */
export async function getVoice(voiceId: string) {
  try {
    const voice = await elevenlabs.voices.get(voiceId);
    return {
      success: true,
      voice: {
        id: voice.voiceId,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        previewUrl: voice.previewUrl,
        labels: voice.labels,
      },
    };
  } catch (error) {
    console.error("Failed to get voice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a signed URL for agent testing in browser (widget/sandbox)
 * @param agentId - The ElevenLabs agent ID
 * @param dynamicVariables - Optional dynamic variables to pass to the conversation
 * @returns Signed URL for browser-based testing
 */
export async function getAgentTestUrl(
  agentId: string,
  dynamicVariables?: Record<string, string>
) {
  try {
    console.log("🔗 Generating signed URL for agent:", agentId);

    const params = new URLSearchParams({
      agent_id: agentId,
    });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to generate signed URL:", error);
      return {
        success: false,
        error: `Failed to generate test URL: ${error}`,
      };
    }

    const data = await response.json();
    console.log("✅ Signed URL generated successfully");

    return {
      success: true,
      signedUrl: data.signed_url,
    };
  } catch (error) {
    console.error("❌ Failed to generate signed URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Add a knowledge base document from URL
 * @param url - The URL of the document to add
 * @param name - Display name for the document
 * @returns Document ID for use in agent configuration
 */
export async function addKnowledgeBaseUrl(url: string, name: string) {
  try {
    console.log("📚 Adding knowledge base document from URL:", url);

    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/knowledge-base/documents/create-from-url",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          name,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to add knowledge base document:", error);
      return {
        success: false,
        error: `Failed to add document: ${error}`,
      };
    }

    const data = await response.json();
    console.log("✅ Knowledge base document added:", data.document_id);

    return {
      success: true,
      documentId: data.document_id,
    };
  } catch (error) {
    console.error("❌ Failed to add knowledge base document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get list of conversations for an agent
 * @param agentId - The ElevenLabs agent ID
 * @param options - Query options (pagination, filters)
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
  try {
    const params = new URLSearchParams();
    if (agentId) params.append("agent_id", agentId);
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.pageSize)
      params.append("page_size", options.pageSize.toString());
    if (options?.callSuccessful)
      params.append("call_successful", options.callSuccessful);
    if (options?.search) params.append("search", options.search);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?${params.toString()}`,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list conversations: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      conversations: data.conversations,
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
    };
  } catch (error) {
    console.error("Failed to list conversations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Verify ElevenLabs webhook HMAC signature
 * @param signature - The signature from the x-elevenlabs-signature header
 * @param body - The raw request body as string
 * @param secret - Your ElevenLabs webhook secret
 * @returns boolean indicating if signature is valid
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
 * Extract key information from ElevenLabs conversation transcript
 */
export function extractCallData(
  transcript: Array<{ role: string; message: string }>
): {
  patientName?: string;
  appointmentDate?: string;
  appointmentReason?: string;
  phoneNumber?: string;
} {
  if (!transcript || !Array.isArray(transcript)) {
    return {};
  }

  // Simple extraction logic - can be enhanced with AI later
  const fullTranscript = transcript
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.message)
    .join(" ");

  // These are placeholder patterns - enhance based on your needs
  const nameMatch = fullTranscript.match(
    /(?:ich heiße|mein name ist|ich bin)\s+([a-zäöüß\s]+)/i
  );
  const reasonMatch = fullTranscript.match(
    /(?:termin für|wegen|grund)\s+([a-zäöüß\s]+)/i
  );

  return {
    patientName: nameMatch?.[1]?.trim(),
    appointmentReason: reasonMatch?.[1]?.trim(),
  };
}

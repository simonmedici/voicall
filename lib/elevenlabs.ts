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
  firstMessage?: string;
  webhookUrl?: string;
  maxDuration?: number;
}

/**
 * Create a new ElevenLabs conversational agent
 * Note: This is a placeholder - actual agent creation via API needs to be implemented
 * For now, agents are created manually in ElevenLabs dashboard
 */
export async function createAgent(config: AgentConfig) {
  try {
    // TODO: Implement agent creation when API is available
    // Currently, agents need to be created via ElevenLabs dashboard
    console.log("Agent configuration:", config);

    return {
      agentId: null,
      success: false,
      error:
        "Agent creation via API not yet implemented - create manually in ElevenLabs dashboard",
    };
  } catch (error) {
    console.error("Failed to create ElevenLabs agent:", error);
    return {
      agentId: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update an existing ElevenLabs agent configuration
 * Updates the agent's prompt, first message, and voice settings
 */
export async function updateAgent(
  agentId: string,
  config: Partial<AgentConfig>
) {
  try {
    // ElevenLabs uses PATCH to update agent config
    const updatePayload: Record<string, unknown> = {};

    if (config.systemPrompt) {
      updatePayload.prompt = {
        prompt: config.systemPrompt,
      };
    }

    if (config.firstMessage) {
      updatePayload.first_message = config.firstMessage;
    }

    if (config.voiceId) {
      updatePayload.tts = {
        voice_id: config.voiceId,
      };
    }

    if (config.language) {
      updatePayload.language = config.language;
    }

    // Use the conversationalAi namespace to update agent
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
      console.error("ElevenLabs API error:", error);
      return {
        success: false,
        error: `Failed to update agent: ${error}`,
      };
    }

    const data = await response.json();
    console.log("Agent updated successfully:", agentId);

    return {
      success: true,
      agent: data,
    };
  } catch (error) {
    console.error("Failed to update ElevenLabs agent:", error);
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
    // TODO: Implement agent deletion when API is available
    console.log("Delete agent:", agentId);

    return {
      success: false,
      error: "Agent deletion via API not yet implemented",
    };
  } catch (error) {
    console.error("Failed to delete ElevenLabs agent:", error);
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
    const voices = await elevenlabs.voices.getAll();
    return {
      success: true,
      voices: voices.voices.map((voice) => ({
        id: voice.voiceId,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        previewUrl: voice.previewUrl,
        labels: voice.labels,
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

import crypto from "crypto";

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

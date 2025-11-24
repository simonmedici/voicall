import { NextRequest, NextResponse } from "next/server";
import { verifyElevenLabsSignature, extractCallData } from "@/lib/elevenlabs";
import { secondsToMinutes } from "@/lib/stripe";
import { db } from "@/lib/db/index";
import { call, subscription, agentConfig, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  sendEmail,
  createNewCallAlertEmail,
  createUsageWarningEmail,
} from "@/lib/sendgrid";

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-elevenlabs-signature");

    if (!signature) {
      console.error("Missing x-elevenlabs-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyElevenLabsSignature(
      signature,
      body,
      process.env.ELEVENLABS_WEBHOOK_SECRET!
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const webhookData = JSON.parse(body);

    // Extract data from webhook
    const {
      conversation_id,
      agent_id,
      status,
      transcript,
      metadata,
      analysis,
      has_audio,
    } = webhookData;

    if (!conversation_id || !agent_id) {
      console.error("Missing required fields in webhook:", webhookData);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find user by agent_id
    const [agentConfigData] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.elevenLabsAgentId, agent_id))
      .limit(1);

    if (!agentConfigData) {
      console.error("No user found for agent_id:", agent_id);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const userId = agentConfigData.userId;

    // Calculate call duration and minutes
    const durationSecs = metadata?.call_duration_secs || 0;
    const minutesCharged = secondsToMinutes(durationSecs);

    // Extract structured data from transcript
    const extractedData = extractCallData(transcript);

    // Determine if call was successful
    const callSuccessful = status === "done" && durationSecs > 10; // At least 10 seconds

    // Save call to database
    const callId = crypto.randomUUID();
    await db.insert(call).values({
      id: callId,
      userId,
      conversationId: conversation_id,
      agentId: agent_id,
      status,
      durationSecs,
      startTime: metadata?.start_time_unix_secs
        ? new Date(metadata.start_time_unix_secs * 1000)
        : new Date(),
      endTime: new Date(),
      transcript: transcript || null,
      metadata: metadata || null,
      analysis: analysis || null,
      hasAudio: has_audio || false,
      audioUrl: null, // Can be fetched later via ElevenLabs API if needed
      extractedData: extractedData || null,
      minutesCharged,
      callSuccessful,
    });

    console.log("Call saved:", callId, "for user:", userId);

    // Send new call alert email
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord?.email) {
      await sendEmail(
        createNewCallAlertEmail(userRecord.email, {
          conversationId: conversation_id,
          duration: durationSecs,
          status,
          transcript: transcript || undefined,
          createdAt: new Date(),
        })
      );
    }

    // Update subscription minutes usage (only for successful calls)
    if (callSuccessful && minutesCharged > 0) {
      const [userSubscription] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId))
        .limit(1);

      if (userSubscription) {
        const newMinutesUsed =
          (userSubscription.minutesUsed || 0) + minutesCharged;

        await db
          .update(subscription)
          .set({
            minutesUsed: newMinutesUsed,
          })
          .where(eq(subscription.userId, userId));

        console.log(
          `Updated minutes for user ${userId}: ${userSubscription.minutesUsed} -> ${newMinutesUsed}`
        );

        // Check if user is approaching limit (80%)
        const minutesIncluded = userSubscription.minutesIncluded;
        if (
          minutesIncluded > 0 && // Not unlimited
          newMinutesUsed >= minutesIncluded * 0.8 &&
          userSubscription.minutesUsed < minutesIncluded * 0.8
        ) {
          console.log(`User ${userId} approaching minute limit (80%)`);

          // Send 80% usage warning email
          if (userRecord?.email) {
            await sendEmail(
              createUsageWarningEmail(userRecord.email, {
                minutesUsed: newMinutesUsed,
                minutesIncluded,
                percentageUsed: (newMinutesUsed / minutesIncluded) * 100,
              })
            );
          }
        }

        // Check if limit exceeded
        if (minutesIncluded > 0 && newMinutesUsed > minutesIncluded) {
          console.log(`User ${userId} exceeded minute limit`);
          // Agent should be deactivated - handled by agent config system
        }
      }
    }

    return NextResponse.json({
      success: true,
      callId,
      minutesCharged,
    });
  } catch (error) {
    console.error("ElevenLabs webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

"use client";

import { useEffect } from "react";
import "@elevenlabs/convai-widget-embed";

interface ElevenLabsWidgetProps {
  agentId: string;
}

export default function ElevenLabsWidget({ agentId }: ElevenLabsWidgetProps) {
  useEffect(() => {
    console.log("✅ ElevenLabs widget mounted with agent:", agentId);
  }, [agentId]);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`,
      }}
    />
  );
}

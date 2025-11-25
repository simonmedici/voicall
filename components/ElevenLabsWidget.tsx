"use client";

import { useEffect } from "react";
import "@elevenlabs/convai-widget-embed";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "agent-id": string },
        HTMLElement
      >;
    }
  }
}

interface ElevenLabsWidgetProps {
  agentId: string;
}

export default function ElevenLabsWidget({ agentId }: ElevenLabsWidgetProps) {
  useEffect(() => {
    console.log("✅ ElevenLabs widget mounted with agent:", agentId);
  }, [agentId]);

  return <elevenlabs-convai agent-id={agentId} />;
}

/**
 * @file MidiStatusIndicator.tsx
 *
 * A small status pill that shows the MIDI bridge connection state.
 * - Hidden when "disconnected" (Vercel / no bridge — no clutter)
 * - Green dot + "MIDI" when connected
 * - Amber dot + "MIDI..." when connecting
 *
 * Styled as a 44×44 round pill matching the IconButton style.
 */

import type { MidiBridgeStatus } from "./useMidiBridge";

interface MidiStatusIndicatorProps {
  status: MidiBridgeStatus;
}

export function MidiStatusIndicator({ status }: MidiStatusIndicatorProps) {
  if (status === "disconnected") return null;

  const isConnected = status === "connected";
  const dotColor = isConnected ? "#22c55e" : "#FBBF24";
  const label = isConnected ? "MIDI" : "MIDI...";

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 44,
        height: 44,
        background: "rgba(42,48,80,0.7)",
      }}
      title={isConnected ? "MIDI keyboard connected" : "Connecting to MIDI bridge..."}
    >
      <div className="flex items-center gap-1">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
          }}
        />
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

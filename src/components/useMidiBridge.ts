/**
 * @file useMidiBridge.ts
 *
 * React hook that connects to the MIDI bridge WebSocket server.
 *
 * **Auto-detection:** On mount, tries to connect to `ws://${location.host}/midi`.
 * If the PWA is served by the MIDI bridge (e.g. http://mac.local:3001), the
 * WebSocket connects and MIDI is live. If served from Vercel or elsewhere,
 * the connection fails silently — no errors, no UI clutter.
 *
 * **Reconnection:** Exponential backoff (1s → 2s → 4s → max 10s), resets on
 * successful connection. Stops reconnecting on unmount.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export type MidiBridgeStatus = "disconnected" | "connecting" | "connected";

export interface MidiNoteOnMessage {
  type: "note-on";
  note: number;
  velocity: number;
}

interface UseMidiBridgeOptions {
  /** Called when a note-on event is received (velocity > 0). */
  onNoteOn?: (msg: MidiNoteOnMessage) => void;
}

interface UseMidiBridgeResult {
  status: MidiBridgeStatus;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

export function useMidiBridge(options: UseMidiBridgeOptions = {}): UseMidiBridgeResult {
  const [status, setStatus] = useState<MidiBridgeStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Use a ref for the callback to avoid re-triggering the effect
  const onNoteOnRef = useRef(options.onNoteOn);
  onNoteOnRef.current = options.onNoteOn;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    setStatus("connecting");

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/midi`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      setStatus("connected");
      backoffRef.current = INITIAL_BACKOFF_MS;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "note-on" && data.velocity > 0) {
          onNoteOnRef.current?.(data as MidiNoteOnMessage);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      wsRef.current = null;
      // Schedule reconnect
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };

    ws.onerror = () => {
      // onerror is always followed by onclose, so just let onclose handle it
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { status };
}

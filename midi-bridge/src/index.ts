/**
 * Vibeyond MIDI Bridge
 *
 * A single HTTP server (port 3001) that does three things:
 * 1. Serves the built PWA from ../dist/ (SPA fallback)
 * 2. Accepts WebSocket connections at /midi
 * 3. Reads USB MIDI input and broadcasts note events to all WebSocket clients
 *
 * Usage:
 *   cd midi-bridge && npm start
 *
 * The iPad loads the app from http://computer.local:3001 instead of Vercel.
 * Same origin = no mixed content issues. MIDI auto-detects in the PWA.
 */

import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { existsSync } from "node:fs";

import sirv from "sirv";
import { WebSocketServer, WebSocket } from "ws";
import midi from "@julusian/midi";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "..", "dist");
const PORT = 3001;

// --- Static file serving ---

if (!existsSync(DIST_DIR)) {
  console.error(
    `\nError: ${DIST_DIR} not found.\n` +
    `Run "npm run build" in the project root first.\n`
  );
  process.exit(1);
}

const serve = sirv(DIST_DIR, { single: true });

const server = createServer((req, res) => {
  serve(req, res);
});

// --- WebSocket at /midi ---

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/midi") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  console.log("  WebSocket client connected");
  ws.on("close", () => {
    console.log("  WebSocket client disconnected");
  });
});

function broadcast(data: string) {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// --- MIDI input ---

const input = new midi.Input();
const portCount = input.getPortCount();

let midiPortName = "(none)";

if (portCount > 0) {
  // Open the first available MIDI input
  midiPortName = input.getPortName(0);
  input.openPort(0);

  input.on("message", (_deltaTime, message) => {
    const [status, note, velocity] = message;
    // Status 0x90 = note-on (channel 1). Velocity 0 = note-off per MIDI spec.
    const channel = status & 0x0f;
    const type = status & 0xf0;

    if (type === 0x90 && velocity > 0) {
      broadcast(JSON.stringify({ type: "note-on", note, velocity }));
    } else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
      broadcast(JSON.stringify({ type: "note-off", note, velocity: 0 }));
    }
  });
} else {
  console.warn("\n  Warning: No MIDI input ports found. Connect a MIDI keyboard and restart.\n");
}

// --- Start server ---

server.listen(PORT, "0.0.0.0", () => {
  const host = hostname();
  console.log(`
Vibeyond MIDI Bridge
  MIDI input: "${midiPortName}"
  Serving:    http://${host}.local:${PORT}

Open the URL above on your iPad.
`);
});

// --- Graceful shutdown ---

function cleanup() {
  console.log("\nShutting down...");
  input.closePort();
  wss.close();
  server.close();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

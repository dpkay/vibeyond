# Vibeyond MIDI Bridge

A lightweight server that connects a physical MIDI keyboard to the Vibeyond PWA over WebSocket. It serves the built PWA and forwards MIDI note events — no configuration needed.

## Prerequisites

- **Node.js 18+**
- **USB MIDI keyboard** connected to your computer
- **PWA built** — run `npm run build` in the project root first

## Setup

```bash
cd midi-bridge
npm install
```

## Usage

```bash
npm start
```

Output:
```
Vibeyond MIDI Bridge
  MIDI input: "Yamaha Digital Piano"
  Serving:    http://my-mac.local:3001

Open the URL above on your iPad.
```

Open the displayed URL on your iPad (or any device on the same network). The app will auto-detect the MIDI bridge and show a green "MIDI" indicator.

## How It Works

The bridge runs a single HTTP server on port 3001 that does three things:

1. **Serves the PWA** — static files from `../dist/` with SPA fallback
2. **WebSocket at `/midi`** — accepts connections from the PWA
3. **MIDI forwarding** — reads the first available USB MIDI input and broadcasts note events as JSON:
   ```json
   {"type":"note-on","note":60,"velocity":100}
   ```

## Platform Notes

- **macOS**: `.local` hostname works out of the box via Bonjour/mDNS
- **Windows**: You may need to use your computer's IP address instead of `.local`
- **Linux**: Install `avahi-daemon` for `.local` hostname resolution, or use the IP address

## iOS Local Network Access

iOS 14+ will prompt once to allow the app to access devices on your local network. Tap "Allow" when prompted.

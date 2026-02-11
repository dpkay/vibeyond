import { defineConfig } from 'vite'
import { execSync } from 'child_process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const gitHash = execSync('git rev-parse --short HEAD').toString().trim()
const now = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const buildId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}_${gitHash}`

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(buildId),
  },
  server: {
    host: '0.0.0.0', // This is the magic line
    port: 5173,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vibeyond',
        short_name: 'Vibeyond',
        description: 'A fun piano note recognition game for kids',
        theme_color: '#1a1040',
        background_color: '#1a1040',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,mp3,ogg,woff,woff2}'],
      },
    }),
  ],
})

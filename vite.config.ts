import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // This is the magic line
    port: 5173,
  },
  plugins: [react(), tailwindcss()],
})

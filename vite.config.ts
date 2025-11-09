import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for itch.io and static hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '127.0.0.1', // Use 127.0.0.1 instead of localhost for Spotify compatibility
    port: 5173,
  },
})



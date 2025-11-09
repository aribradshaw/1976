import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for itch.io and static hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Cosmic-trader/',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
}) 
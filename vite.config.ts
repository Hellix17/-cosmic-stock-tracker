import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/-cosmic-stock-tracker/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
}) 
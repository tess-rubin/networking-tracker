import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'frontend',
  envDir: '..',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['../tests/setup.js'],
  },
})


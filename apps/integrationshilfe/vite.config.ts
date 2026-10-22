import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Alles (inkl. PDF-Chunk und Schrift) vorab cachen: vollständig offline nutzbar.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Verlaufsdokumentation Integrationshilfe',
        short_name: 'Verlauf',
        description: 'Beobachtungen schnell erfassen und als Verlaufsbericht exportieren – lokal auf dem Gerät.',
        lang: 'de',
        theme_color: '#1E4E8C',
        background_color: '#F7F9FC',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
})

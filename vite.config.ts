// In Datei: vite.config.ts
// VOLLSTÄNDIGER CODE (bitte gesamten Inhalt ersetzen)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. PWA-Plugin importieren

// https://vitejs.dev/config/
export default defineConfig({
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    
    // 2. PWA-Plugin konfigurieren
    VitePWA({
      registerType: 'autoUpdate', // App aktualisiert sich automatisch
      devOptions: {
        enabled: true // Aktiviert PWA auch im 'npm run dev' Modus
      },
      manifest: {
        name: 'GrowFlow Hydroplaner',
        short_name: 'GrowFlow',
        description: 'Wissenschaftlicher Rechner für Hydroponik-Anbau.',
        theme_color: '#1A202C', // Dark Mode Farbe (gray.800)
        background_color: '#1A202C',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
        ]
      }
    })
  ],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mdi/js')) return 'mdi'
          if (id.includes('hue-icons.json')) return 'hue-icons'
          if (id.includes('html2canvas')) return 'html2canvas'
          if (id.includes('dompurify') || id.includes('purify')) return 'purify'
        },
      },
    },
  },
})

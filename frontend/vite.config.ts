import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Un único .env en la raíz del repo; Vite solo expone al bundle las variables VITE_*.
  envDir: '..',
  server: {
    // En desarrollo, el navegador llama a /api y Vite lo reenvía a FastAPI.
    proxy: { '/api': 'http://localhost:8000' },
  },
})

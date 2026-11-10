import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Añade <link rel="preconnect"> al dominio de Clerk (el "Frontend API", que va codificado en
 * base64 dentro de la clave pública pk_test_/pk_live_). Así el navegador abre la conexión mientras
 * descarga la SPA y Clerk está listo antes, que es lo que retrasaba los botones de sesión.
 */
function preconectarClerk(publishableKey?: string): Plugin {
  return {
    name: 'preconectar-clerk',
    transformIndexHtml() {
      const codificado = publishableKey?.split('_')[2]
      if (!codificado) return
      const host = Buffer.from(codificado, 'base64').toString('utf8').replace(/\$$/, '')
      if (!/^[a-z0-9.-]+$/i.test(host)) return
      return [{ tag: 'link', attrs: { rel: 'preconnect', href: `https://${host}`, crossorigin: '' }, injectTo: 'head' }]
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Un único .env en la raíz del repo; Vite solo expone al bundle las variables VITE_*.
  const env = loadEnv(mode, '..', 'VITE_')
  return {
    plugins: [react(), tailwindcss(), preconectarClerk(env.VITE_CLERK_PUBLISHABLE_KEY)],
    envDir: '..',
    server: {
      // En desarrollo, el navegador llama a /api y Vite lo reenvía a FastAPI.
      proxy: { '/api': 'http://localhost:8000' },
    },
  }
})

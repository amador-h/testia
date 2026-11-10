import { ClerkProvider } from '@clerk/react'
import { esES } from '@clerk/localizations'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Clave PÚBLICA de Clerk: se incrusta en el bundle al compilar (nunca la secreta).
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = createRoot(document.getElementById('root')!)

if (!PUBLISHABLE_KEY) {
  root.render(
    <p className="p-8 text-rose-700">
      Falta <code>VITE_CLERK_PUBLISHABLE_KEY</code> al compilar el frontend.
    </p>,
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        localization={esES}
        afterSignOutUrl="/"
        appearance={{
          // Mismo acento y radio que la app para que los modales de Clerk no desentonen.
          variables: { colorPrimary: '#4f46e5', borderRadius: '0.75rem', fontFamily: 'inherit' },
          // La instancia sigue siendo de DESARROLLO (claves pk_test_/sk_test_, como pide el
          // enunciado); esto solo oculta la etiqueta "Development mode" de los modales.
          options: { unsafe_disableDevelopmentModeWarnings: true },
        }}
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}

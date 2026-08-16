import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import { PageHeaderProvider } from '@/contexts/PageHeaderProvider.tsx'

import App from './App.tsx'

const queryClient = new QueryClient()

// Registro nativo e explícito: mantém o PWA instalado atualizado sem depender
// do módulo opcional workbox-window.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let recarregando = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando) return
      recarregando = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registro) => registro.update())
      .catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PageHeaderProvider>
            <App />
          </PageHeaderProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)

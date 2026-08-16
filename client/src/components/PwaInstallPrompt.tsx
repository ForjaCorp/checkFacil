import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let promptPendente: BeforeInstallPromptEvent | null = null

// O navegador pode disparar este evento antes de o React montar o componente.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  promptPendente = event as BeforeInstallPromptEvent
  window.dispatchEvent(new Event('checkfacil:pwa-install-disponivel'))
})

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error - propriedade legada do Safari no iOS
  Boolean(window.navigator.standalone)

export function PwaInstallPrompt() {
  const [instalado, setInstalado] = useState(isStandalone)
  const [dispensado, setDispensado] = useState(false)
  const [mostrarAjuda, setMostrarAjuda] = useState(false)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(promptPendente)
  const isIOS =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)

  useEffect(() => {
    const aoInstalar = () => setInstalado(true)
    const aoDisponibilizarInstalacao = () => setPrompt(promptPendente)
    const media = window.matchMedia('(display-mode: standalone)')
    const aoMudarModo = () => setInstalado(isStandalone())

    window.addEventListener('appinstalled', aoInstalar)
    window.addEventListener('checkfacil:pwa-install-disponivel', aoDisponibilizarInstalacao)
    media.addEventListener('change', aoMudarModo)
    return () => {
      window.removeEventListener('appinstalled', aoInstalar)
      window.removeEventListener('checkfacil:pwa-install-disponivel', aoDisponibilizarInstalacao)
      media.removeEventListener('change', aoMudarModo)
    }
  }, [])

  if (instalado || dispensado) return null

  const instalar = async () => {
    if (!prompt) {
      setMostrarAjuda(true)
      return
    }
    await prompt.prompt()
    const escolha = await prompt.userChoice
    if (escolha.outcome === 'accepted') setInstalado(true)
    promptPendente = null
    setPrompt(null)
  }

  return (
    <aside className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-md rounded-xl border bg-background p-4 shadow-2xl lg:bottom-4">
      <button
        type="button"
        aria-label="Fechar orientação de instalação"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground"
        onClick={() => setDispensado(true)}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-6 text-sm font-semibold">Você está usando o CheckFácil no navegador</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isIOS
          ? 'Para abrir sem as barras do Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
          : 'Instale o aplicativo para abrir em tela cheia e ter uma experiência mais estável.'}
      </p>
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={isIOS ? () => setMostrarAjuda((atual) => !atual) : instalar}
      >
        {isIOS ? <Share className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
        {isIOS ? 'Instalar no iPhone' : 'Instalar aplicativo'}
      </Button>
      {mostrarAjuda && (
        <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {isIOS ? (
            <ol className="list-decimal space-y-1 pl-4">
              <li>Abra esta página no Safari.</li>
              <li>Toque no botão Compartilhar.</li>
              <li>Escolha “Adicionar à Tela de Início”.</li>
              <li>Mantenha “Abrir como app web” marcado e confirme.</li>
            </ol>
          ) : (
            <p>
              Abra o menu do navegador e escolha “Instalar CheckFácil” ou “Adicionar à tela inicial”.
            </p>
          )}
        </div>
      )}
    </aside>
  )
}

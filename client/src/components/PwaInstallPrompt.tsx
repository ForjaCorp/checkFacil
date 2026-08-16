import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error - propriedade legada do Safari no iOS
  Boolean(window.navigator.standalone)

export function PwaInstallPrompt() {
  const [instalado, setInstalado] = useState(isStandalone)
  const [dispensado, setDispensado] = useState(false)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  useEffect(() => {
    const aoInstalar = () => setInstalado(true)
    const aoDisponibilizarInstalacao = (event: Event) => {
      event.preventDefault()
      setPrompt(event as BeforeInstallPromptEvent)
    }
    const media = window.matchMedia('(display-mode: standalone)')
    const aoMudarModo = () => setInstalado(isStandalone())

    window.addEventListener('appinstalled', aoInstalar)
    window.addEventListener('beforeinstallprompt', aoDisponibilizarInstalacao)
    media.addEventListener('change', aoMudarModo)
    return () => {
      window.removeEventListener('appinstalled', aoInstalar)
      window.removeEventListener('beforeinstallprompt', aoDisponibilizarInstalacao)
      media.removeEventListener('change', aoMudarModo)
    }
  }, [])

  if (instalado || dispensado) return null

  const instalar = async () => {
    if (!prompt) return
    await prompt.prompt()
    const escolha = await prompt.userChoice
    if (escolha.outcome === 'accepted') setInstalado(true)
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
      {isIOS ? (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
          <Share className="h-4 w-4" />
          Compartilhar → Adicionar à Tela de Início
        </div>
      ) : prompt ? (
        <Button size="sm" className="mt-3 w-full" onClick={instalar}>
          <Download className="mr-2 h-4 w-4" />
          Instalar aplicativo
        </Button>
      ) : null}
    </aside>
  )
}

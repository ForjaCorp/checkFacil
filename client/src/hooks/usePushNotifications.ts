import { useCallback, useEffect, useState } from 'react'

import api from '@/services/api'

function urlBase64ParaUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

/** Detecta iOS rodando fora do PWA instalado (push nao funciona nesse cenario). */
export function isIosSemInstalar(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - API antiga do iOS Safari
    Boolean(window.navigator.standalone)
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  return isIOS && !standalone
}

interface PushState {
  suportado: boolean
  ativado: boolean
  carregando: boolean
  ativando: boolean
  iosSemInstalar: boolean
}

/**
 * Ativa/desativa notificacoes push do dispositivo atual.
 * Fluxo: permissao -> subscribe com VAPID -> POST /api/push/inscrever
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    suportado: false,
    ativado: false,
    carregando: true,
    ativando: false,
    iosSemInstalar: false,
  })

  useEffect(() => {
    const verificar = async () => {
      const suportado =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
      const iosSemInstalar = suportado ? isIosSemInstalar() : false
      let ativado = false
      if (suportado && Notification.permission === 'granted') {
        try {
          const registro = await navigator.serviceWorker.ready
          ativado = Boolean(await registro.pushManager.getSubscription())
        } catch {
          ativado = false
        }
      }
      setState((s) => ({ ...s, suportado, ativado, iosSemInstalar, carregando: false }))
    }
    verificar()
  }, [])

  const ativar = useCallback(async (): Promise<{ ok: boolean; mensagem: string }> => {
    setState((s) => ({ ...s, ativando: true }))
    try {
      const { data } = await api.get('/push/chave-publica')
      const chavePublica = data?.chavePublica as string | undefined
      if (!chavePublica) {
        return { ok: false, mensagem: 'Notificações não configuradas no servidor.' }
      }

      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        return { ok: false, mensagem: 'Permissão de notificação negada no navegador.' }
      }

      const registro = await navigator.serviceWorker.ready
      const subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(chavePublica),
      })

      await api.post('/push/inscrever', { subscription: subscription.toJSON() })
      setState((s) => ({ ...s, ativado: true }))
      return { ok: true, mensagem: 'Notificações ativadas neste dispositivo!' }
    } catch (error) {
      console.error('[push] Falha ao ativar:', error)
      return { ok: false, mensagem: 'Não foi possível ativar as notificações.' }
    } finally {
      setState((s) => ({ ...s, ativando: false }))
    }
  }, [])

  const desativar = useCallback(async (): Promise<{ ok: boolean; mensagem: string }> => {
    setState((s) => ({ ...s, ativando: true }))
    try {
      const registro = await navigator.serviceWorker.ready
      const subscription = await registro.pushManager.getSubscription()
      if (subscription) {
        await api.delete('/push/inscrever', { data: { subscription: subscription.toJSON() } })
        await subscription.unsubscribe()
      }
      setState((s) => ({ ...s, ativado: false }))
      return { ok: true, mensagem: 'Notificações desativadas.' }
    } catch (error) {
      console.error('[push] Falha ao desativar:', error)
      return { ok: false, mensagem: 'Não foi possível desativar as notificações.' }
    } finally {
      setState((s) => ({ ...s, ativando: false }))
    }
  }, [])

  const enviarTeste = useCallback(async (): Promise<{ ok: boolean; mensagem: string }> => {
    try {
      const { data } = await api.post('/push/teste')
      return { ok: true, mensagem: data?.mensagem ?? 'Teste enviado.' }
    } catch (error) {
      const mensagem =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Falha ao enviar o teste.'
      return { ok: false, mensagem }
    }
  }, [])

  return { ...state, ativar, desativar, enviarTeste }
}

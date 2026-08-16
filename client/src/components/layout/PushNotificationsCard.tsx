import { Bell, BellOff, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * Card para ativar/desativar notificacoes push no dispositivo atual.
 * Inclui teste e o aviso de instalacao no iPhone.
 */
export function PushNotificationsCard() {
  const { suportado, ativado, carregando, ativando, iosSemInstalar, ativar, desativar, enviarTeste } =
    usePushNotifications()
  const [testando, setTestando] = useState(false)

  if (carregando) return null

  if (!suportado) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <BellOff className="h-5 w-5 shrink-0" />
          Este navegador não suporta notificações push.
        </CardContent>
      </Card>
    )
  }

  const handleTeste = async () => {
    setTestando(true)
    const resultado = await enviarTeste()
    setTestando(false)
    if (resultado.ok) toast.success(resultado.mensagem)
    else toast.error(resultado.mensagem)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {ativado ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
          Notificações
        </CardTitle>
        <CardDescription>
          {ativado
            ? 'Você recebe avisos de novos eventos do espaço neste dispositivo.'
            : 'Ative para receber avisos de novos eventos do espaço na barra de notificações.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant={ativado ? 'outline' : 'default'}
          size="sm"
          disabled={ativando}
          onClick={async () => {
            const resultado = ativado ? await desativar() : await ativar()
            if (resultado.ok) toast.success(resultado.mensagem)
            else toast.error(resultado.mensagem)
          }}
        >
          {ativando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ativado ? 'Desativar neste dispositivo' : 'Ativar notificações'}
        </Button>
        {ativado && (
          <Button variant="ghost" size="sm" disabled={testando} onClick={handleTeste}>
            {testando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar teste
          </Button>
        )}
        {iosSemInstalar && (
          <p className="w-full text-xs text-muted-foreground">
            No iPhone, as notificações só chegam com o app instalado: toque em Compartilhar no Safari
            e depois em “Adicionar à Tela de Início”.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

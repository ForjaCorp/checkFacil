import { Bell, BellOff, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/authContextCore'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { isAdminEmail } from '@/lib/adminEmails'

/**
 * Card para ativar/desativar notificacoes push no dispositivo atual.
 * O botao de teste aparece apenas para titulares (validacao tecnica),
 * clientes comuns veem apenas o controle de ativar/desativar.
 */
export function PushNotificationsCard() {
  const { user } = useAuth()
  const { suportado, ativado, carregando, ativando, iosSemInstalar, ativar, desativar, enviarTeste } =
    usePushNotifications()
  const [testando, setTestando] = useState(false)

  // Botao de teste e diagnostico: restrito aos titulares
  const podeTestar = isAdminEmail(user?.email)

  if (carregando) return null

  if (!suportado) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <BellOff className="h-5 w-5 shrink-0" />
          {iosSemInstalar
            ? 'No iPhone, adicione o site à Tela de Início e abra o app pelo novo ícone para ativar as notificações.'
            : 'Este navegador ou sistema não suporta notificações push.'}
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
        {ativado && podeTestar && (
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

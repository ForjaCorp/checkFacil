import { Bell, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/usePushNotifications'

const CHAVE_DISPENSADO = 'checkfacil:push-banner-dispensado'

/**
 * Banner discreto no dashboard do cliente oferecendo a ativacao das
 * notificacoes. Navegadores exigem um clique do usuario para conceder
 * a permissao — o banner aproxima esse momento do primeiro uso.
 * Dispensavel (lembra via localStorage).
 */
export function PushAtivacaoBanner() {
  const { suportado, ativado, carregando, ativando, ativar } = usePushNotifications()

  if (carregando || !suportado || ativado) return null
  if (localStorage.getItem(CHAVE_DISPENSADO) === '1') return null

  const dispensar = () => localStorage.setItem(CHAVE_DISPENSADO, '1')

  return (
    <div data-banner="push" className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Bell className="h-5 w-5 shrink-0 text-primary" />
        <p className="min-w-0 text-sm">
          <span className="font-medium">Ativar notificações</span>{' '}
          <span className="text-muted-foreground">
            receba avisos de novos eventos do espaço no seu celular.
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          disabled={ativando}
          onClick={async () => {
            const resultado = await ativar()
            if (resultado.ok) dispensar()
          }}
        >
          {ativando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ativar
        </Button>
        <Button variant="ghost" size="icon" title="Agora não" onClick={dispensar}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

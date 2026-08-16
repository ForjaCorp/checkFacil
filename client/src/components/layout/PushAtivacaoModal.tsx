import { BellRing, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePushNotifications, isIosSemInstalar } from '@/hooks/usePushNotifications'

const CHAVE_DISPENSADO = 'checkfacil:push-modal-dispensado'

/**
 * Modal de ativacao das notificacoes, exibido na primeira visita do cliente
 * ao dashboard. A permissao de push exige um clique do usuario — este modal
 * aproxima o consentimento do primeiro uso. Dispensavel (lembra via localStorage).
 */
export function PushAtivacaoModal() {
  const { suportado, ativado, carregando, ativando, ativar } = usePushNotifications()

  const aberto = !carregando && suportado && !ativado && localStorage.getItem(CHAVE_DISPENSADO) !== '1'

  const dispensar = () => localStorage.setItem(CHAVE_DISPENSADO, '1')

  return (
    <Dialog open={aberto} onOpenChange={(valor) => (valor ? undefined : dispensar())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center sm:text-center">Fique por dentro! 🎉</DialogTitle>
          <DialogDescription className="text-center sm:text-center">
            Ative as notificações e seja avisado no celular sobre novos eventos do espaço —
            colônias de férias, dia das mães e muito mais.
          </DialogDescription>
        </DialogHeader>

        {isIosSemInstalar() && (
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            No iPhone, as notificações só chegam com o app instalado: toque em Compartilhar no Safari
            e depois em “Adicionar à Tela de Início”.
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={ativando}
            onClick={async () => {
              const resultado = await ativar()
              if (resultado.ok) dispensar()
            }}
          >
            {ativando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ativar notificações
          </Button>
          <Button variant="ghost" className="w-full" onClick={dispensar}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

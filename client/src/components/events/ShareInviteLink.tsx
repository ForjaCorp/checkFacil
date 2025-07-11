import { Check, Copy, MessageCircle, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ShareInviteLinkProps {
  eventId: string
}

export function ShareInviteLink({ eventId }: ShareInviteLinkProps) {
  const [hasCopied, setHasCopied] = useState(false)

  const inviteLink = `${window.location.origin}/guest/flow-selection/${eventId}`

  const partyName = 'nossa festa'
  const whatsappText = encodeURIComponent(
    `Olá! 🎉 Você foi convidado para ${partyName}! Confirme sua presença através do link: ${inviteLink}`,
  )
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setHasCopied(true)
    toast.success('Link copiado para a área de transferência!')

    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer sm:w-auto">
          <LinkIcon className="mr-2 h-4 w-4" />
          Convidar Pessoas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhe o Link do Convite</DialogTitle>
          <DialogDescription>
            Qualquer pessoa com este link poderá confirmar presença na sua festa. Compartilhe com
            seus convidados!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2 pt-2">
          <Label htmlFor="invite-link" className="sr-only">
            Link do Convite
          </Label>
          <div className="flex items-center space-x-2">
            <Input id="invite-link" value={inviteLink} readOnly className="flex-1" />
            <Button type="button" size="icon" className="px-3" onClick={handleCopy}>
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">{hasCopied ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Compartilhar no WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

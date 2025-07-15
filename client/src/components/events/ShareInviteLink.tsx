// client/src/components/events/ShareInviteLink.tsx

import { useQuery } from '@tanstack/react-query'
import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import api from '@/services/api'

interface ShareInviteLinkProps {
  eventId: string
}

export function ShareInviteLink({ eventId }: ShareInviteLinkProps) {
  const [hasCopied, setHasCopied] = useState(false)
  const [isShareSupported, setIsShareSupported] = useState(false)

  useEffect(() => {
    setIsShareSupported(!!navigator.share)
  }, [])

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })

  const inviteLink = `${window.location.origin}/guest/${eventId}/flow-selection`
  const partyName = eventData?.nome_festa || 'nossa festa'
  const inviteImageURL = eventData?.link_convite

  const handleShare = async () => {
    const shareText = `Olá! 🎉 Você foi convidado para ${partyName}! Confirme sua presença através do link.`
    const shareData = {
      title: `Convite para ${partyName}`,
      text: shareText,
      url: inviteLink,
    }

    // Verifica se há suporte básico à API
    if (!navigator.share) {
      toast.error('Seu navegador não suporta o compartilhamento direto.', {
        description: 'Use o botão do WhatsApp ou copie o link manualmente.',
      })
      return
    }

    try {
      // Se tiver imagem, tenta com arquivos
      if (inviteImageURL) {
        const response = await fetch(inviteImageURL)
        const blob = await response.blob()
        const file = new File([blob], 'convite.jpg', { type: blob.type })

        // Verifica se é possível compartilhar arquivos
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            ...shareData,
            files: [file],
          })
          return
        } else {
          console.warn('Compartilhamento de arquivos não suportado.')
        }
      }

      // Fallback para texto/link apenas
      await navigator.share(shareData)
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast.error('Não foi possível compartilhar.', {
        description: 'Use o botão do WhatsApp ou copie o link manualmente.',
      })
    }
  }

  const whatsappText = encodeURIComponent(
    `Olá! 🎉 Você foi convidado para ${partyName}! Confirme sua presença através do link: ${inviteLink}`,
  )
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`

  const emailSubject = encodeURIComponent(`Convite para ${partyName}`)
  const emailBody = encodeURIComponent(
    `Olá!\n\nVocê foi convidado para ${partyName}.\n\nConfirme sua presença através do link abaixo:\n\n${inviteLink}`,
  )
  const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* CORREÇÃO: O botão volta ao estilo padrão e é usado na página de convidados */}
        <Button className="w-full sm:w-auto">
          <Share2 className="mr-2 h-4 w-4" />
          Convidar Pessoas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhe o Convite</DialogTitle>
          <DialogDescription>
            Você pode compartilhar este convite com amigos ou familiares pelos meios abaixo.
          </DialogDescription>
        </DialogHeader>

        {/* Botão nativo, apenas se for suportado */}
        {isShareSupported && (
          <Button onClick={handleShare} className="w-full mt-4">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar Agora
          </Button>
        )}

        {/* Separador */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Fallback manual */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="invite-link" className="text-left">
            Link de confirmação
          </Label>
          <div className="flex items-center space-x-2">
            <Input id="invite-link" value={inviteLink} readOnly className="flex-1" />
            <Button
              type="button"
              size="icon"
              className="px-3"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink)
                  setHasCopied(true)
                  toast.success('Link copiado!')
                  setTimeout(() => setHasCopied(false), 2000)
                } catch (err) {
                  toast.error('Não foi possível copiar o link.')
                }
              }}
            >
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="success" className="w-full">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" />
                Enviar pelo WhatsApp
              </a>
            </Button>

            <Button asChild variant="secondary" className="w-full">
              <a href={emailUrl} target="_blank" rel="noopener noreferrer">
                <Mail className="mr-1 h-4 w-4" />
                Enviar por Email
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-4" />
      </DialogContent>
    </Dialog>
  )
}

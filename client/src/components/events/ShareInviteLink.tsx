// client/src/components/events/ShareInviteLink.tsx

import { useQuery } from '@tanstack/react-query';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';

interface ShareInviteLinkProps {
  eventId: string;
}

export function ShareInviteLink({ eventId }: ShareInviteLinkProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await api.get(`/festa/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
  });

  const inviteLink = `${window.location.origin}/guest/flow-selection/${eventId}`;
  const partyName = eventData?.nome_festa || 'nossa festa';
  const inviteImageURL = eventData?.link_convite;

  const handleShare = async () => {
    const shareText = `Olá! 🎉 Você foi convidado para ${partyName}! Confirme sua presença através do link.`;

    if (!navigator.share) {
        toast.error('Seu navegador não suporta esta função.', {
            description: 'Use o botão do WhatsApp ou copie o link manualmente.',
        });
        return;
    }

    try {
        if (inviteImageURL) {
            const response = await fetch(inviteImageURL);
            const blob = await response.blob();
            const file = new File([blob], 'convite.jpg', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Convite para ${partyName}`,
                    text: shareText,
                    url: inviteLink,
                    files: [file],
                });
                return;
            }
        }
        
        // Fallback se não houver imagem ou se o navegador não puder compartilhar arquivos
        await navigator.share({
            title: `Convite para ${partyName}`,
            text: shareText,
            url: inviteLink,
        });

    } catch (error) {
        console.error('Erro ao usar navigator.share:', error);
        toast.error('Não foi possível compartilhar.', {
            description: 'Por favor, copie o link manualmente.',
        });
    }
  };
  
  const whatsappText = encodeURIComponent(
    `Olá! 🎉 Você foi convidado para ${partyName}! Confirme sua presença através do link: ${inviteLink}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

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
            Use o botão &quot;Compartilhar Agora&quot; para enviar a imagem do convite e o link.
          </DialogDescription>
        </DialogHeader>

        <Button onClick={handleShare} className="w-full mt-4">
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar Agora
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">OU</span></div>
        </div>
        
        <div className="flex flex-col space-y-2 pt-2">
          <Label htmlFor="invite-link" className="text-left">Copiar link de confirmação</Label>
          <div className="flex items-center space-x-2">
            <Input id="invite-link" value={inviteLink} readOnly className="flex-1" />
            <Button
              type="button"
              size="icon"
              className="px-3"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  setHasCopied(true);
                  toast.success('Link copiado!');
                  setTimeout(() => setHasCopied(false), 2000);
                } catch (err) {
                  toast.error('Falha ao copiar. Seu navegador pode não suportar esta ação em modo de desenvolvimento.');
                }
              }}
            >
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button asChild className="w-full" variant="success">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar pelo WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

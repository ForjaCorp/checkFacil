import { CalendarDays, LayoutGrid, PlusCircle, User, Music2, Smartphone } from 'lucide-react'
import { useState } from 'react'

import { BottomNavLink } from '@/components/layout/BottomNavLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/authContextCore'
import { isAdminEmail } from '@/lib/adminEmails'

// Importando o Gerenciador e componentes de Modal (Dialog)
import { EvolutionManager } from './EvolutionManager'

/**
 * Barra de navegação inferior para dispositivos móveis.
 * A opção de "WhatsApp" e "Criar" são exibidas apenas para administradores.
 */
export function BottomNavBar() {
  const { user } = useAuth()
  const [isEvoOpen, setIsEvoOpen] = useState(false)

  // Lógica de permissão validada para administradores
  const isAdmin = isAdminEmail(user?.email)

  const userInitials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)

  const profileIcon = user?.photoUrl ? (
    <Avatar className="h-6 w-6">
      <AvatarImage src={user.photoUrl} alt={`Avatar de ${user.name}`} />
      <AvatarFallback className="text-[10px]">{userInitials}</AvatarFallback>
    </Avatar>
  ) : (
    <User className="h-6 w-6" />
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-border shadow-t-md z-50 lg:hidden">
      <TooltipProvider delayDuration={0}>
        {/* O Grid ajusta entre 5 colunas (Admin) ou 4 colunas (Usuário padrão) */}
        <div className={`grid h-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
          
          <BottomNavLink
            to={isAdmin ? '/staff/dashboard' : '/organizer/dashboard'}
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Festas"
          />

          <BottomNavLink
            to="/staff/playlists"
            icon={<Music2 className="h-6 w-6" />}
            label="Playlists"
          />

          {!isAdmin && (
            <BottomNavLink
              to="/organizer/eventos"
              icon={<CalendarDays className="h-6 w-6" />}
              label="No espaço"
            />
          )}

          {/* Área restrita: Criar Festa e Conexão WhatsApp */}
          {isAdmin && (
            <>
              <BottomNavLink
                to="/staff/events/createEventDraft"
                icon={<PlusCircle className="h-6 w-6" />}
                label="Criar"
              />

              {/* Gatilho do WhatsApp - Abre o Modal igual ao Desktop */}
              <Dialog open={isEvoOpen} onOpenChange={setIsEvoOpen}>
                <DialogTrigger asChild>
                  <button 
                    onClick={() => setIsEvoOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors active:scale-95 outline-none"
                  >
                    <Smartphone className="h-6 w-6" />
                    <span className="text-[10px] font-medium leading-none">WhatsApp</span>
                  </button>
                </DialogTrigger>
                
                <DialogContent className="w-[95vw] max-w-[500px] rounded-t-xl sm:rounded-lg overflow-hidden">
                  <DialogHeader className="text-left">
                    <DialogTitle>Gerenciar Conexão</DialogTitle>
                    <DialogDescription>
                      Conecte ou desconecte a instância do WhatsApp para envios.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <EvolutionManager />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <BottomNavLink
            to="/profile"
            icon={profileIcon}
            label="Perfil"
          />
        </div>
      </TooltipProvider>
    </nav>
  )
}

export default BottomNavBar;

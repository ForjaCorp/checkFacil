import { LayoutGrid, PlusCircle, LogOut, Music2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Ajustado para caminhos relativos para resolver erros de compilação
import { useAuth } from '../../contexts/authContextCore'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { TooltipProvider } from '../ui/tooltip'

// Importando o Gerenciador e componentes de Modal (Dialog) com caminhos relativos
import { EvolutionManager } from './EvolutionManager'
import { SideBarLink } from './SideBarLink'

export function SideBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEvoOpen, setIsEvoOpen] = useState(false)

  // Lógica de permissão para visualização de ferramentas administrativas
  const podeCriar =
    user?.email === 'barradeespacoe@gmail.com' ||
    user?.email === 'adm2.espacocriaraju@gmail.com'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userInitials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)

  return (
    <aside className="hidden border-r bg-card lg:block w-[280px]">
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="">Check Fácil</span>
            </Link>
          </div>
          
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-2 px-2 text-sm font-medium lg:px-4">
              <SideBarLink
                to={podeCriar ? '/staff/dashboard' : '/organizer/dashboard'}
                icon={<LayoutGrid className="h-5 w-5" />}
                label="Eventos"
                tooltip="Ver Eventos"
              />

              <SideBarLink
                to="/staff/playlists"
                icon={<Music2 className="h-5 w-5" />}
                label="Playlists"
                tooltip="Gerenciar Playlists"
              />

              {podeCriar && (
                <>
                  <SideBarLink
                    to="/staff/events/createEventDraft"
                    icon={<PlusCircle className="h-5 w-5" />}
                    label="Criar Festa"
                    tooltip="Criar Nova Festa"
                  />

                  {/* Gerenciamento de Conexão WhatsApp via Modal acessível pela Sidebar */}
                  <Dialog open={isEvoOpen} onOpenChange={setIsEvoOpen}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted w-full text-left font-medium">
                        <Smartphone className="h-5 w-5" />
                        WhatsApp
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Gerenciar Conexão</DialogTitle>
                        <DialogDescription>
                          Conecte ou desconecte a instância do WhatsApp para envios do sistema.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <EvolutionManager />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t flex flex-col gap-4">
            <Link to="/profile" className="flex items-center gap-3 group">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={`Avatar de ${user?.name}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5 text-xs">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {user?.name}
                </p>
                <p className="text-muted-foreground text-[10px] truncate max-w-[150px]">{user?.email}</p>
              </div>
            </Link>
            <Button size="sm" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  )
}
import { LayoutGrid, PlusCircle, LogOut, Music2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { SideBarLink } from '@/components/layout/SideBarLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/authContextCore'

export function SideBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // 🔥 apenas para criar festa
  const podeCriar =
    user?.email === 'barradeespacoe@gmail.com' ||
    user?.email === 'adm.espacocriaraju@gmail.com'

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

              {/* ✅ Playlist sempre visível */}
              <SideBarLink
                to="/staff/playlists"
                icon={<Music2 className="h-5 w-5" />}
                label="Playlists"
                tooltip="Gerenciar Playlists"
              />

              {/* ✅ Criar Festa só para os permitidos */}
              {podeCriar && (
                <SideBarLink
                  to="/staff/events/createEventDraft"
                  icon={<PlusCircle className="h-5 w-5" />}
                  label="Criar Festa"
                  tooltip="Criar Nova Festa"
                />
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
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </Link>
            <Button size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  )
}

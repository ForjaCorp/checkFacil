import { LayoutGrid, PlusCircle, User, Music2 } from 'lucide-react'

import { BottomNavLink } from '@/components/layout/BottomNavLink'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/authContextCore'

export function BottomNavBar() {
  const { user } = useAuth()

  // 🔥 apenas para criar festa
  const podeCriar =
    user?.email === 'barradeespacoe@gmail.com' ||
    user?.email === 'adm2.espacocriaraju@gmail.com'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-border shadow-t-md z-50 lg:hidden">
      <TooltipProvider delayDuration={0}>
        <div className={`grid h-full ${podeCriar ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <BottomNavLink
            to={podeCriar ? '/staff/dashboard' : '/organizer/dashboard'}
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Eventos"
          />

          {/* ✅ Playlist sempre visível */}
          <BottomNavLink
            to="/staff/playlists"
            icon={<Music2 className="h-6 w-6" />}
            label="Playlists"
          />

          {/* ✅ Criar Festa só para os permitidos */}
          {podeCriar && (
            <BottomNavLink
              to="/staff/events/createEventDraft"
              icon={<PlusCircle className="h-6 w-6" />}
              label="Criar"
            />
          )}

          <BottomNavLink
            to="/profile"
            icon={<User className="h-6 w-6" />}
            label="Perfil"
          />
        </div>
      </TooltipProvider>
    </nav>
  )
}

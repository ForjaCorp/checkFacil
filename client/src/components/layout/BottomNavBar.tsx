import { LayoutGrid, PlusCircle, User, Music2 } from 'lucide-react'

import { BottomNavLink } from '@/components/layout/BottomNavLink'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/authContextCore'

/**
 * A bottom navigation bar that renders links to the dashboard and profile pages, and a
 * "Criar" link if the user is a staff member.
 *
 * It uses the `BottomNavLink` component to render the links, and the
 * `TooltipProvider` component to provide tooltips for the links.
 *
 * It also uses the `LayoutGrid` and `PlusCircle` icons from `lucide-react`.
 *
 * The component is hidden on large screens and above.
 *
 * @returns The BottomNavBar component.
 */
export function BottomNavBar() {
  const { user } = useAuth()
  const isStaff = user?.userType === 'Adm_espaco'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-t-md z-50 lg:hidden">
      <TooltipProvider delayDuration={0}>
        <div className={`grid h-full ${isStaff ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <BottomNavLink
            to={isStaff ? '/staff/dashboard' : '/organizer/dashboard'}
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Eventos"
          />

          {isStaff && (
            <>
              <BottomNavLink
                to="/staff/events/createEventDraft"
                icon={<PlusCircle className="h-6 w-6" />}
                label="Criar"
              />
              <BottomNavLink
                to="/staff/playlists"
                icon={<Music2 className="h-6 w-6" />}
                label="Playlists"
              />
            </>
          )}

          <BottomNavLink to="/profile" icon={<User className="h-6 w-6" />} label="Perfil" />
        </div>
      </TooltipProvider>
    </nav>
  )
}

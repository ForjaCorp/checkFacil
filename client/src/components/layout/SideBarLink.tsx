import { NavLink } from 'react-router-dom'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

interface SideBarLinkProps {
  to: string
  icon: ReactNode
  label: string
  tooltip: string
}

/**
 * Renders a navigation link for the sidebar.
 *
 * @param {{ to: string; icon: ReactNode; label: string; tooltip: string }} props
 * @returns {JSX.Element}
 */
export function SideBarLink({ to, icon, label, tooltip }: SideBarLinkProps) {
  const baseClasses = 'block rounded-lg p-3 border-l-4'
  const inactiveClasses =
    'border-transparent text-muted-foreground hover:bg-muted hover:text-primary'
  const activeClasses = 'border-primary bg-muted font-semibold text-primary'

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(baseClasses, isActive ? activeClasses : inactiveClasses)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-4">
            {icon}
            <span className="truncate">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </NavLink>
  )
}

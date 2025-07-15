import { NavLink } from 'react-router-dom'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

interface BottomNavLinkProps {
  to: string
  icon: ReactNode
  label: string
}

/**
 * Renders a bottom navigation link with an icon and label.
 *
 * This component uses a `NavLink` to handle active and inactive states,
 * and displays a tooltip with the label when hovered over.
 *
 * @param {string} to - The destination path for the navigation link.
 * @param {ReactNode} icon - The icon to display within the navigation link.
 * @param {string} label - The label to display within the navigation link and tooltip.
 * @returns {JSX.Element} - The rendered bottom navigation link component.
 */

export function BottomNavLink({ to, icon, label }: BottomNavLinkProps) {
  const baseClasses = 'flex flex-col items-center justify-center gap-1 w-full h-full'
  const inactiveClasses = 'text-primary-foreground'
  const activeClasses = 'text-yellow-300'

  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Tooltip>
          <TooltipTrigger className="h-full w-full">
            <div className={cn(baseClasses, isActive ? activeClasses : inactiveClasses)}>
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </NavLink>
  )
}

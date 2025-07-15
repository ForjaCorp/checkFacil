import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { usePageHeader } from '@/hooks/usePageHeader'

export function MobileHeader() {
  const navigate = useNavigate()
  const { title } = usePageHeader()
  const location = useLocation()

  const hideBackButtonOnRoutes = [
    '/staff/dashboard',
    '/organizer/dashboard',
    '/guest/flow-selection',
  ]
  const showBackButton = !hideBackButtonOnRoutes.some((path) => location.pathname.startsWith(path))

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground border-b border-border shadow-sm z-50 lg:hidden flex items-center px-2 gap-2">
      <div className="flex-none w-10 h-10">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
      </div>
      <div className="flex-1 text-center overflow-hidden">
        <h2 className="text-lg font-semibold truncate">{title || ''}</h2>
      </div>
      <div className="flex-none w-10 h-10" />
    </header>
  )
}

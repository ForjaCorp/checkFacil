import { ArrowLeft } from 'lucide-react'


import { Button } from '@/components/ui/button'
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { ReactNode } from 'react'

interface StepHeaderProps {
  title: string
  description: string
  onBack?: () => void
  icon?: ReactNode
}

export function StepHeader({
  title,
  description,
  onBack,
  icon, 
}: StepHeaderProps) {  
  return (
    <div className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onBack}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {icon && <div className="text-primary">{icon}</div>}
              <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
            </div>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border">
        <Separator className="h-px" />
      </div>
    </div>
  )
}

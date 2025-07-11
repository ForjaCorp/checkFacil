import { type LucideIcon } from 'lucide-react'
import { type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ActionButtonProps extends ComponentProps<typeof Button> {
  icon: LucideIcon
  tooltip: string
}

export function ActionButton({
  icon: Icon,
  tooltip,
  className,
  variant,
  ...props
}: ActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              {
                'text-destructive hover:bg-destructive/10 hover:text-destructive':
                  variant === 'destructive',
              },
              className,
            )}
            {...props}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

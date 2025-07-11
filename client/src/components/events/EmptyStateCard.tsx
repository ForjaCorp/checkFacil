import { Inbox } from 'lucide-react'

import type { ReactNode } from 'react'

interface EmptyStateCardProps {
  title: string
  description: string
  icon?: ReactNode
}

export function EmptyStateCard({
  title,
  description,
  icon = <Inbox className="h-12 w-12 text-muted-foreground" />,
}: EmptyStateCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center text-center p-6 border-2 border-dashed rounded-lg h-full">
      <div className="flex flex-col items-center gap-4">
        {icon}
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">{description}</p>
        </div>
      </div>
    </div>
  )
}

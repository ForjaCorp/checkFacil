import type { AppEvent } from '@/types'
import type { ReactNode } from 'react'

interface EventListItemProps {
  event: AppEvent
  actions: ReactNode
}

export function EventListItem({ event, actions }: EventListItemProps) {
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      RASCUNHO: 'Rascunho',
      PRONTA: 'Pronta para Execução',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDA: 'Concluída',
    }
    return statusMap[status] || status
  }

  return (
    <li className="border-b last:border-b-0 pb-4 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold">{event.name}</h3>
        <p className="text-sm text-muted-foreground">
          Data: {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
        </p>
        {event.organizerName && (
          <p className="text-sm text-muted-foreground">Organizador: {event.organizerName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Status: <span className="font-medium">{getStatusText(event.status)}</span>
        </p>
      </div>
      <div className="flex flex-row shrink-0 gap-2 w-full sm:w-auto">{actions}</div>
    </li>
  )
}

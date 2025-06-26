import { Calendar, FilePenLine, PlayCircle, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { AppEvent } from '@/types'

interface EventCardProps {
  event: AppEvent
}

export function EventCard({ event }: EventCardProps) {
  // NOVO e final sistema de nomes e cores para as badges
  const getStatusInfo = (
    status: string,
  ): {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined
    className?: string
  } => {
    switch (status) {
      case 'RASCUNHO':
        return { text: 'Pendente', variant: 'secondary' }
      case 'PRONTA':
        return {
          text: 'Confirmada',
          variant: 'default',
          className: 'bg-blue-600 text-white border-transparent hover:bg-blue-700',
        }
      case 'EM_ANDAMENTO':
        return { text: 'Ao Vivo', variant: 'destructive' }
      case 'CONCLUIDA':
        return { text: 'Finalizada', variant: 'outline' }
      default:
        return { text: status, variant: 'outline' }
    }
  }

  const statusInfo = getStatusInfo(event.status)

  return (
    <Card className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold">{event.name}</CardTitle>
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
        </div>
        <CardDescription>Organizador: {event.organizerName || 'Não definido'}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span>{new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
        </div>
      </CardContent>

      <div className="flex-grow" />

      <CardFooter className="grid grid-cols-3 gap-2 pt-4 mt-auto">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/5 hover:text-primary"
        >
          <Link
            to={`/staff/event/${event.id}/details`}
            className="flex items-center justify-center whitespace-nowrap"
          >
            <FilePenLine className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Detalhes</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/5 hover:text-primary"
        >
          <Link
            to={`/event/${event.id}/guests`}
            className="flex items-center justify-center whitespace-nowrap"
          >
            <Users className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Convidados</span>
          </Link>
        </Button>

        {/* Botão de Ação (Sólido Roxo) */}
        <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
          <Link
            to={`/staff/event/${event.id}/checkin`}
            className="flex items-center justify-center whitespace-nowrap"
          >
            <PlayCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Check-in</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

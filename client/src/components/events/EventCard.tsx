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
  variant: 'staff' | 'organizer'
}

export function EventCard({ event, variant }: EventCardProps) {
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

  const isStaff = variant === 'staff'

  return (
    <Card className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold">{event.name}</CardTitle>
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
        </div>
        {isStaff && (
          <CardDescription>Organizador: {event.organizerName || 'Não definido'}</CardDescription>
        )}
      </CardHeader>

      <CardContent className='flex-grow'>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span>{new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4 border-t-2 border-dashed">
        {isStaff ? (
          <>
            <div className="flex sm:flex-row gap-2 w-full">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto flex-1 text-primary border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Link to={`/staff/event/${event.id}/details`} className="flex items-center justify-center">
                  <FilePenLine className="h-4 w-4" />
                  <span className="ml-2">Detalhes</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto flex-1 text-primary border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Link to={`/event/${event.id}/guests`} className="flex items-center justify-center">
                  <Users className="h-4 w-4" />
                  <span className="ml-2">Convidados</span>
                </Link>
              </Button>
            </div>
            <Button asChild size="sm" variant="success" className="w-full">
              <Link to={`/staff/event/${event.id}/checkin`} className="flex items-center justify-center">
                <PlayCircle className="h-4 w-4" />
                <span className="ml-2">Check-in</span>
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-primary border-primary hover:bg-primary/5 hover:text-primary"
            >
              <Link to={`/organizer/event/${event.id}/details`} className="flex items-center justify-center">
                <FilePenLine className="h-4 w-4" />
                <span className="ml-2">
                  {event.status === 'RASCUNHO' ? 'Completar' : 'Detalhes'}
                </span>
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to={`/event/${event.id}/guests`} className="flex items-center justify-center">
                <Users className="h-4 w-4" />
                <span className="ml-2">Convidados</span>
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

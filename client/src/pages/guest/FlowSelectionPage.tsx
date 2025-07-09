import { useQuery } from '@tanstack/react-query'
import { Loader2, User, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/services/api'

// Componente auxiliar para os cards de escolha, para manter o código limpo
function ChoiceCard({
  to,
  icon,
  title,
  description,
  disabled,
}: {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  disabled?: boolean
}) {
  return (
    <Link to={to} className={cn('outline-none', disabled && 'pointer-events-none')}>
      <Card
        className={cn(
          'group flex h-full cursor-pointer flex-col gap-2 justify-center p-6 text-center transition-all',
          disabled
            ? 'cursor-not-allowed bg-muted/50'
            : 'hover:border-primary hover:bg-muted/50 dark:hover:bg-muted/20',
        )}
      >
        <div
          className={cn(
            'mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors',
            !disabled && 'group-hover:bg-primary group-hover:text-primary-foreground',
          )}
        >
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </Link>
  )
}

export default function FlowSelectionPage() {
  const { eventId } = useParams<{ eventId: string }>()

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}/public`)
      return response.data
    },
    enabled: !!eventId,
    retry: 1,
  })

  const renderHeader = () => {
    if (isLoading) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )
    }

    if (isError || !event) {
      return (
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-destructive">
            Evento não encontrado
          </h1>
          <p className="text-muted-foreground">
            O link pode estar incorreto ou o evento não está mais disponível.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Confirmar presença em:
        </h1>
        <p className="text-2xl font-semibold text-primary">{event.nome_festa}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4 sm:p-6">
      <div className="w-full max-w-3xl space-y-8 text-center">
        {renderHeader()}

        <Card className="text-left">
          <CardHeader>
            <CardTitle>Para quem você está confirmando presença?</CardTitle>
            <CardDescription>Escolha uma das opções abaixo para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChoiceCard
              to={`/guest/${eventId}/confirm-adult`}
              icon={<User className="size-8" />}
              title="Sou um adulto"
              description="Vou sozinho ou com outros adultos."
              disabled={isLoading || isError || !event}
            />
            <ChoiceCard
              to={`/guest/${eventId}/confirm-responsible`}
              icon={<Users className="size-8" />}
              title="Sou responsável por crianças"
              description="Vou confirmar a presença de uma ou mais crianças."
              disabled={isLoading || isError || !event}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

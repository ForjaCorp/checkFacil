import { useQuery } from '@tanstack/react-query'
import { User, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageHeader } from '@/hooks/usePageHeader'
import { cn } from '@/lib/utils'
import api from '@/services/api'

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
          'group flex h-full cursor-pointer flex-col justify-center gap-2 p-6 text-center transition-all',
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
  const { setTitle } = usePageHeader()

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
  useEffect(() => {
    if (event?.nome_festa) {
      setTitle(`${event.nome_festa}`)
    }
  }, [event, setTitle])

  return (
    <div className="flex w-full items-center justify-center bg-muted/30 p-4 sm:p-6 min-h-[calc(100vh-4rem)] lg:min-h-screen">
      <div className="w-full max-w-6xl">
        <PageHeader
          title="Confirmar presença"
          description={event?.nome_festa ? `Festa de ${event.nome_festa}` : ''}
        />

        <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Coluna da Imagem */}
          {event?.link_convite && (
            <div className="flex justify-center">
              <img
                src={event.link_convite}
                alt={`Convite para ${event.nome_festa}`}
                className="rounded-lg shadow-lg aspect-[3/4] h-auto w-full max-w-sm object-cover"
              />
            </div>
          )}

          {/* Coluna do Card de Ação */}
          <div
            className={cn(
              'w-full',
              !event?.link_convite && 'lg:col-span-2 flex justify-center', // Centraliza o card se não houver imagem
            )}
          >
            <div className={cn(!event?.link_convite && 'max-w-3xl')}>
              <Card className="text-left">
                <CardHeader>
                  <CardTitle>Para quem você está confirmando presença?</CardTitle>
                  <CardDescription>Escolha uma das opções abaixo para continuar.</CardDescription>
                </CardHeader>
                <CardContent className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>
      </div>
    </div>
  )
}

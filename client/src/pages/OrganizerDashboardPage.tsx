import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EventCard } from '@/components/events/EventCard'
import { useAuth } from '@/contexts/authContextCore'
import api from '@/services/api'

import type { AppEvent, ApiEventResponse } from '@/types'

export default function OrganizerDashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<AppEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/festa/listar')
        const mappedEvents: AppEvent[] = response.data.festas.map(
          (eventFromApi: ApiEventResponse) => ({
            id: eventFromApi.id,
            name: eventFromApi.nome_festa,
            date: eventFromApi.data_festa,
            status: eventFromApi.status,
          }),
        )
        setEvents(mappedEvents)
      } catch (error) {
        console.error('Erro ao buscar eventos do contratante:', error)
        toast.error('Não foi possível carregar seus eventos.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizerEvents()
  }, [])

  return (
    <div className="flex flex-col gap-6 h-full py-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Meu Painel</h1>
        {user && <p className="text-lg text-muted-foreground">Bem-vindo(a), {user.name}!</p>}
      </header>

      <section className="flex flex-col gap-4 flex-grow">
        <h2 className="text-2xl font-semibold text-foreground">Meus Eventos Agendados</h2>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {events.map((event) => (
              <EventCard key={event.id} event={event} variant="organizer" />
            ))}
          </div>
        ) : (
          // Usando o mesmo estilo de "estado vazio"
          <div className="flex flex-1 items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Nenhum evento agendado</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Assim que a nossa equipe criar o seu evento, ele aparecerá aqui para você gerenciar.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

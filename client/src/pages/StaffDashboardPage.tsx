// client/src/pages/StaffDashboardPage.tsx

import { Loader2, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EventCard } from '@/components/events/EventCard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/authContextCore'
import api from '@/services/api'

import type { ApiEventResponse, AppEvent } from '@/types'

const StaffDashboardPage = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<AppEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/festa/listar')
        const mappedEvents: AppEvent[] = response.data.festas.map(
          (eventFromApi: ApiEventResponse) => ({
            id: eventFromApi.id,
            name: eventFromApi.nome_festa,
            date: eventFromApi.data_festa,
            status: eventFromApi.status,
            organizerName: eventFromApi.organizador?.nome,
          }),
        )
        setEvents(mappedEvents)
      } catch (error) {
        console.error('Erro ao buscar eventos:', error)
        toast.error('Não foi possível carregar os eventos.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  return (
    <div className="flex flex-col gap-6 h-full py-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel do Staff</h1>
          {user && <p className="text-lg text-muted-foreground">Bem-vindo(a), {user.name}!</p>}
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link to="/staff/events/createEventDraft">
            <PlusCircle className="mr-2 h-5 w-5" />
            <span>Criar Nova Festa</span>
          </Link>
        </Button>
      </header>

      <section className="flex flex-col gap-4 flex-grow">
        <h2 className="text-2xl font-semibold text-foreground">Festas Agendadas</h2>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : events.length > 0 ? (
          // AQUI ESTÁ A CORREÇÃO: adicionamos 'items-start'
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Nenhuma festa encontrada</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Parece que ainda não há eventos agendados. Que tal criar o primeiro?
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default StaffDashboardPage

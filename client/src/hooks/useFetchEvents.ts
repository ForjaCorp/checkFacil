import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import api from '@/services/api'

import type { ApiEventResponse, AppEvent } from '@/types'

interface FetchEventsOptions {
  includeOrganizerName?: boolean
}

export function useFetchEvents(options?: FetchEventsOptions) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/festa/listar')

      const mappedEvents: AppEvent[] = response.data.festas.map(
        (eventFromApi: ApiEventResponse) => ({
          id: eventFromApi.id,
          name: eventFromApi.nome_festa,
          date: eventFromApi.data_festa,
          status: eventFromApi.status,
          organizerName: options?.includeOrganizerName ? eventFromApi.organizador?.nome : undefined,
        }),
      )

      setEvents(mappedEvents)
    } catch (err) {
      const errorMessage = 'Não foi possível carregar os eventos.'
      console.error('Erro em useFetchEvents:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [options?.includeOrganizerName])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, isLoading, error, refetchEvents: fetchEvents }
}

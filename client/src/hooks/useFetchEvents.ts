import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import api from '@/services/api'

import type { ApiEventResponse, AppEvent } from '@/types'

/**
 * Hook para buscar eventos no backend.
 *
 * @param {FetchEventsOptions} [options] - Opcional. Opções para a busca.
 * @param {boolean} [options.includeOrganizerName=false] - Inclui o nome do organizador no resultado.
 * @param {number} [options.page=1] - Número da página para buscar.
 * @param {number} [options.limit=6] - Número de itens por página.
 * @returns {UseFetchEventsReturn}
 */
interface FetchEventsOptions {
  includeOrganizerName?: boolean
  page?: number
  limit?: number
}

/**
 * Interface do retorno do hook.
 */
interface UseFetchEventsReturn {
  /**
   * Lista de eventos.
   */
  events: AppEvent[]
  /**
   * Indica se a busca está em andamento.
   */
  isLoading: boolean
  /**
   * Mensagem de erro, caso tenha ocorrido um.
   */
  error: string | null
  /**
   * Função para refazer a busca.
   */
  refetchEvents: () => void
  /**
   * Informações sobre a paginação.
   */
  pagination: {
    /**
     * Número da página atual.
     */
    currentPage: number
    /**
     * Número total de páginas.
     */
    totalPages: number
    /**
     * Número total de itens.
     */
    totalItems: number
  }
}

export function useFetchEvents(options: FetchEventsOptions = {}): UseFetchEventsReturn {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  const { includeOrganizerName = false, page = 1, limit = 6 } = options

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/festa/listar', {
        params: {
          page,
          limit,
        },
      })

      const { festas, totalPages, currentPage, totalItems } = response.data

      const mappedEvents: AppEvent[] = festas.map((eventFromApi: ApiEventResponse) => ({
        id: eventFromApi.id,
        name: eventFromApi.nome_festa,
        date: eventFromApi.data_festa,
        status: eventFromApi.status,
        organizerName: includeOrganizerName ? eventFromApi.organizador?.nome : undefined,
      }))

      setEvents(mappedEvents)
      setPagination({ totalPages, currentPage, totalItems })
    } catch (err) {
      const errorMessage = 'Não foi possível carregar os eventos.'
      console.error('Erro em useFetchEvents:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [includeOrganizerName, page, limit])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, isLoading, error, refetchEvents: fetchEvents, pagination }
}

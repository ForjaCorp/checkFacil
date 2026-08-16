import { useQuery, type QueryFunctionContext } from '@tanstack/react-query'
import { endOfMonth, format, startOfMonth, startOfToday } from 'date-fns'
import { CalendarDays, LayoutGrid, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EventCalendarView } from '@/components/events/EventCalendarView'
import { EventSection } from '@/components/events/EventSection'
import { EventosEspacoBanner } from '@/components/events/EventosEspacoBanner'
import { PushAtivacaoBanner } from '@/components/layout/PushAtivacaoBanner'
import { DashboardFilters } from '@/components/layout/DashboardFilters'
import { PageHeader } from '@/components/layout/PageHeader'
import { WhatsAppStatusIndicator } from '@/components/layout/WhatsAppStatusIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { dashboardConfig } from '@/config/dashboardConfig'
import { useAuth } from '@/contexts/authContextCore'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageHeader } from '@/hooks/usePageHeader'
import api from '@/services/api'

// ✅ IMPORTANTE: Importando o novo indicador de status simplificado

import type { ApiEventResponse, AppEvent, EventsQueryOptions } from '@/types'
import type { DateRange } from 'react-day-picker'

const mapApiEvent = (eventFromApi: ApiEventResponse): AppEvent => ({
  id: eventFromApi.id,
  name: eventFromApi.nome_festa,
  date: eventFromApi.data_festa,
  status: eventFromApi.status,
  organizerName: eventFromApi.organizador?.nome,
  startTime: eventFromApi.horario_inicio,
  endTime: eventFromApi.horario_fim,
  birthdayAge: eventFromApi.idade_aniversariante,
  packageType: eventFromApi.pacote_escolhido,
  guestsCount: eventFromApi.numero_convidados_contratado,
})

export default function DashboardPage() {
  const { user } = useAuth()
  const config = user ? dashboardConfig[user.userType] : null
  const { setTitle } = usePageHeader()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [activeCategory, setActiveCategory] = useState<
    'this_month' | 'upcoming' | 'completed' | null
  >(null)
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista')

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    if (config) {
      setTitle(config.header.title)
    }
    return () => setTitle(null)
  }, [config, setTitle])

  const fetchEvents = async ({ queryKey }: QueryFunctionContext<[string, EventsQueryOptions]>) => {
    const [_key, options] = queryKey
    const params = {
      page: options.page,
      limit: 6,
      search: options.search,
      status: options.status,
      data_inicio: options.startDate,
      data_fim: options.endDate,
    }
    const { data } = await api.get('/festa/listar', { params })
    const mappedEvents = data.festas.map(mapApiEvent)

    return {
      festas: mappedEvents,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      totalItems: data.totalItems,
    }
  }

  const queryOptions = {
    page: currentPage,
    search: debouncedSearchTerm,
    status: statusFilter === 'TODOS' ? undefined : statusFilter,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  }

  const {
    data: queryData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['events', queryOptions],
    queryFn: fetchEvents,
    placeholderData: (previousData) => previousData,
  })

  // Calendario: busca todas as festas (sem paginacao) aplicando busca e status
  const {
    data: calendarEvents,
    isLoading: isCalendarLoading,
  } = useQuery({
    queryKey: ['events-calendar', debouncedSearchTerm, statusFilter === 'TODOS' ? undefined : statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/festa/listar', {
        params: {
          page: 1,
          limit: 500,
          search: debouncedSearchTerm || undefined,
          status: statusFilter === 'TODOS' ? undefined : statusFilter,
        },
      })
      return data.festas.map(mapApiEvent) as AppEvent[]
    },
    enabled: viewMode === 'calendario',
  })

  const events = queryData?.festas || []
  const pagination = {
    currentPage: queryData?.currentPage || 1,
    totalPages: queryData?.totalPages || 1,
    totalItems: queryData?.totalItems || 0,
  }

  if (!user || !config) {
    return null
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('TODOS')
    setDateRange(undefined)
    setCurrentPage(1)
    setActiveCategory(null)
  }

  const applyCategoryFilter = (category: 'this_month' | 'upcoming' | 'completed') => {
    clearFilters()
    switch (category) {
      case 'this_month': {
        const today = new Date()
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      }
      case 'upcoming': {
        setDateRange({ from: startOfToday(), to: undefined })
        break
      }
      case 'completed': {
        setStatusFilter('CONCLUIDA')
        break
      }
      default:
        break
    }
    setActiveCategory(category)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={config.header.title}
        description={config.header.getSubtitle(user.name || user.email)}
      />

      {/* ✅ NOVO: Indicador de Status do WhatsApp na Home
          Apenas visível para o Administrador do Espaço
      */}
      {user.userType === 'Adm_espaco' && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <WhatsAppStatusIndicator />
        </section>
      )}

      {/* Banner de eventos do espaco (colonias de ferias, datas especiais) — visao do cliente */}
      {user.userType === 'Adm_festa' && (
        <>
          <PushAtivacaoBanner />
          <EventosEspacoBanner />
        </>
      )}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
          Ocorreu um erro ao carregar os eventos. Por favor, tente novamente mais tarde.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da festa..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Toggle Lista / Calendario */}
          <div className="grid grid-cols-2 gap-1 rounded-lg border p-1 sm:w-auto">
            <Button
              size="sm"
              variant={viewMode === 'lista' ? 'secondary' : 'ghost'}
              className="h-8"
              onClick={() => setViewMode('lista')}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Lista
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calendario' ? 'secondary' : 'ghost'}
              className="h-8"
              onClick={() => setViewMode('calendario')}
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              Calendário
            </Button>
          </div>
        </div>

        {viewMode === 'lista' && (
          <DashboardFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            applyCategoryFilter={applyCategoryFilter}
            activeCategory={activeCategory}
            clearFilters={clearFilters}
          />
        )}
      </div>

      {viewMode === 'calendario' ? (
        isCalendarLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando calendário...</p>
        ) : (
          <EventCalendarView events={calendarEvents ?? []} variant={config.events.cardVariant} />
        )
      ) : (
        <EventSection
        isLoading={isLoading}
        events={events}
        sectionTitle="Resultados"
        emptyStateTitle="Nenhum evento encontrado"
        emptyStateDescription="Tente ajustar os filtros ou adicione um novo evento."
        cardVariant={config.events.cardVariant}
        footer={
          pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage + 1)
                    }}
                    className={
                      currentPage === pagination.totalPages
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )
        }
        />
      )}
    </div>
  )
}
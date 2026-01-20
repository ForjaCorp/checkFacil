import { useQuery, type QueryFunctionContext } from '@tanstack/react-query'
import { endOfMonth, format, startOfMonth, startOfToday } from 'date-fns'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EventSection } from '@/components/events/EventSection'
import { DashboardFilters } from '@/components/layout/DashboardFilters'
import { PageHeader } from '@/components/layout/PageHeader'
import { WhatsAppStatusIndicator } from '@/components/layout/WhatsAppStatusIndicator'
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

import type { ApiEventResponse, EventsQueryOptions } from '@/types'
import type { DateRange } from 'react-day-picker'

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
    const mappedEvents = data.festas.map((eventFromApi: ApiEventResponse) => ({
      id: eventFromApi.id,
      name: eventFromApi.nome_festa,
      date: eventFromApi.data_festa,
      status: eventFromApi.status,
      organizerName: eventFromApi.organizador?.nome,
    }))

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

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
          Ocorreu um erro ao carregar os eventos. Por favor, tente novamente mais tarde.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da festa..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DashboardFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          applyCategoryFilter={applyCategoryFilter}
          activeCategory={activeCategory}
          clearFilters={clearFilters}
        />
      </div>

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
    </div>
  )
}
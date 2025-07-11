import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Clock, Calendar, Loader2, PlusCircle, Search } from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { GuestCheckinCard } from '@/components/guests/GuestCheckinCard'
import { WalkinGuestRegistration } from '@/components/guests/WalkinGuestRegistration'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageHeader } from '@/hooks/usePageHeader'
import api from '@/services/api'

interface ApiGuestResponse {
  id: number
  nome_convidado: string
  checkin_at?: string | null
  checkout_at?: string | null
  cadastrado_na_hora?: boolean
}

interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
  walkedIn: boolean
  checkin_at: string | null
}

const CheckinPage = () => {
  const queryClient = useQueryClient()
  const { eventId } = useParams<{ eventId: string }>()
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null)
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  type SortOrder = 'status' | 'checkin_time_desc' | 'name_asc'
  const [sortOrder, setSortOrder] = useState<SortOrder>('status')
  type StatusFilter = 'all' | 'Aguardando' | 'Presente'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const queryKey = ['guests', eventId, debouncedSearchTerm]

  const { setTitle } = usePageHeader()
  const { data: eventData, isLoading: isEventLoading } = useQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })

  useEffect(() => {
    if (eventData) {
      setTitle(`Check-in: ${eventData.nome_festa}`)
    }
    return () => setTitle(null)
  }, [eventData, setTitle])

  const mapGuestData = (guestFromApi: ApiGuestResponse): CheckinGuest => {
    let status: CheckinGuest['status'] = 'Aguardando'
    if (guestFromApi.checkout_at) {
      status = 'Saiu'
    } else if (guestFromApi.checkin_at) {
      status = 'Presente'
    }
    return {
      id: guestFromApi.id,
      name: guestFromApi.nome_convidado,
      status,
      walkedIn: guestFromApi.cadastrado_na_hora || false,
      checkin_at: guestFromApi.checkin_at || null,
    }
  }

  const { data: guests = [], isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!eventId) return []

      let response
      if (debouncedSearchTerm) {
        response = await api.get(`/festa/${eventId}/convidados/buscar`, {
          params: { nome: debouncedSearchTerm },
        })
      } else {
        response = await api.get(`/festa/${eventId}/convidados`)
      }
      return response.data.map(mapGuestData) as CheckinGuest[]
    },
    enabled: !!eventId,
  })

  const sortedGuests = useMemo(() => {
    const statusOrder: Record<CheckinGuest['status'], number> = {
      Aguardando: 1,
      Presente: 2,
      Saiu: 3,
    }

    const filteredGuests = guests.filter((guest) => {
      if (statusFilter === 'all') return true
      return guest.status === statusFilter
    })

    return [...filteredGuests].sort((a, b) => {
      switch (sortOrder) {
        case 'checkin_time_desc': {
          if (a.checkin_at && !b.checkin_at) return -1
          if (!a.checkin_at && b.checkin_at) return 1

          if (!a.checkin_at && !b.checkin_at) {
            return a.name.localeCompare(b.name)
          }

          const timeA = new Date(a.checkin_at!).getTime()
          const timeB = new Date(b.checkin_at!).getTime()
          return timeB - timeA
        }
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'status':
        default: {
          const statusDifference = statusOrder[a.status] - statusOrder[b.status]
          if (statusDifference !== 0) return statusDifference
          return a.name.localeCompare(b.name)
        }
      }
    })
  }, [guests, sortOrder, statusFilter])

  const guestsPresentCount = useMemo(() => {
    return sortedGuests.filter((guest) => guest.status === 'Presente').length
  }, [sortedGuests])

  const { mutate: handleCheckin } = useMutation({
    mutationFn: (guestId: number) => api.patch(`/festa/${eventId}/convidados/${guestId}/checkin`),
    onMutate: async (guestId: number) => {
      setIsActionLoading(guestId)
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<CheckinGuest[]>(queryKey)
      queryClient.setQueryData<CheckinGuest[]>(queryKey, (oldGuests = []) =>
        oldGuests.map((guest) =>
          guest.id === guestId
            ? { ...guest, status: 'Presente', checkin_at: new Date().toISOString() }
            : guest,
        ),
      )
      return { previousGuests }
    },
    onError: (_error, _guestId, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }

      let errorMessage = 'Não foi possível fazer o check-in. Tente novamente.'
      if (axios.isAxiosError(_error) && _error.response?.data?.error) {
        errorMessage = _error.response.data.error
      } else if (_error instanceof Error) {
        errorMessage = _error.message
      }

      toast.error('Falha no Check-in', {
        description: errorMessage,
      })
    },

    onSettled: () => {
      setIsActionLoading(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutate: handleCheckout } = useMutation({
    mutationFn: (guestId: number) => api.patch(`/festa/${eventId}/convidados/${guestId}/checkout`),
    onMutate: async (guestId: number) => {
      setIsActionLoading(guestId)
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<CheckinGuest[]>(queryKey)
      queryClient.setQueryData<CheckinGuest[]>(queryKey, (oldGuests = []) =>
        oldGuests.map((guest) => (guest.id === guestId ? { ...guest, status: 'Saiu' } : guest)),
      )
      return { previousGuests }
    },
    onError: (_error, _guestId, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }

      let errorMessage = 'Não foi possível fazer o check-out. Tente novamente.'
      if (axios.isAxiosError(_error) && _error.response?.data?.error) {
        errorMessage = _error.response.data.error
      } else if (_error instanceof Error) {
        errorMessage = _error.message
      }

      toast.error('Falha no Check-out', {
        description: errorMessage,
      })
    },

    onSettled: () => {
      setIsActionLoading(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleWalkinSuccess = () => {
    setIsWalkinDialogOpen(false)
    queryClient.invalidateQueries({ queryKey })
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title={`Check-in: ${eventData?.nome_festa || 'Evento'}`}
        description="Acompanhe a entrada e saída dos convidados em tempo real."
      />

      <div className="border rounded-lg p-4 lg:p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4 flex-1">
          <h2 className="text-xl font-semibold">Resumo do Evento</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {isEventLoading ? (
              <span>Carregando detalhes...</span>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />{' '}
                  {new Date(
                    eventData?.data_festa.replace(/-/g, '/') || Date.now(),
                  ).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {eventData?.horario_inicio?.substring(0, 5)} -{' '}
                  {eventData?.horario_fim?.substring(0, 5)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="default" className="bg-green-600 text-white">
              Presentes: {guestsPresentCount}
            </Badge>
            <Badge variant="secondary">Total: {sortedGuests.length}</Badge>
          </div>
        </div>

        <div className="space-y-4 w-full lg:w-2/5 xl:w-1/3">
          <h2 className="text-xl font-semibold">Ações</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'Aguardando' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('Aguardando')}
            >
              Aguardando
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'Presente' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('Presente')}
            >
              Presentes
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar convidado pelo nome..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-2">
            <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
              <SelectTrigger className="flex-1 w-full h-11 min-w-[240px]">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Ordenar por Status (Padrão)</SelectItem>
                <SelectItem value="name_asc">Ordenar por Ordem Alfabética</SelectItem>
                <SelectItem value="checkin_time_desc">Ordenar por Recém-chegados</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isWalkinDialogOpen} onOpenChange={setIsWalkinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 flex-1 min-w-[240px]">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Convidado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Convidado na Hora</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do responsável e dos convidados.
                  </DialogDescription>
                </DialogHeader>
                <WalkinGuestRegistration onSuccess={handleWalkinSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <hr className="border-border" />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGuests.length > 0 ? (
            sortedGuests.map((guest) => (
              <GuestCheckinCard
                key={guest.id}
                guest={guest}
                isActionLoading={isActionLoading === guest.id}
                onCheckin={handleCheckin}
                onCheckout={handleCheckout}
              />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhum convidado encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default CheckinPage

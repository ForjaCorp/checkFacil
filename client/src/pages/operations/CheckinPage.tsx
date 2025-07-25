import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Calendar, PlusCircle, Search, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
// Hooks
import { useCheckinOperations } from '@/hooks/useCheckinOperations'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageHeader } from '@/hooks/usePageHeader'
// Services
import api from '@/services/api'

// Types
import type { GuestType } from '@/types'

interface ApiGuestResponse {
  id: number
  nome_convidado: string
  checkin_at?: string | null
  checkout_at?: string | null
  cadastrado_na_hora?: boolean
  tipo_convidado: GuestType
  telefone_convidado?: string | null
  telefone_responsavel_contato?: string | null
}

interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
  walkedIn: boolean
  checkin_at: string | null
  guestType: GuestType
  phoneNumber: string | null
}

const CheckinPage = () => {
  const queryClient = useQueryClient()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  type SortOrder = 'status' | 'checkin_time_desc' | 'name_asc'
  const [sortOrder, setSortOrder] = useState<SortOrder>('name_asc')
  
  type StatusFilter = 'all' | 'Aguardando' | 'Presente' | 'Saiu'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  
  const { handleCheckin, handleCheckout, isCheckinLoading, isCheckoutLoading } = useCheckinOperations(eventId!)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const queryKey = ['guests', eventId]

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
      guestType: guestFromApi.tipo_convidado,
      phoneNumber: guestFromApi.telefone_convidado || guestFromApi.telefone_responsavel_contato || null,
    }
  }

  const { data: guests = [], isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!eventId) return []
      const response = await api.get(`/festa/${eventId}/convidados`)
      return response.data.map(mapGuestData) as CheckinGuest[]
    },
    enabled: !!eventId,
  })

  const filteredAndSortedGuests = useMemo(() => {
    const statusOrder: Record<CheckinGuest['status'], number> = {
      Aguardando: 1,
      Presente: 2,
      Saiu: 3,
    }

    const filteredBySearch = guests.filter((guest) =>
      guest.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    const filteredByStatus = filteredBySearch.filter((guest) => {
      if (statusFilter === 'all') return true
      return guest.status === statusFilter
    })

    return [...filteredByStatus].sort((a, b) => {
      switch (sortOrder) {
        case 'checkin_time_desc': {
          if (a.checkin_at && !b.checkin_at) return -1
          if (!a.checkin_at && b.checkin_at) return 1
          if (!a.checkin_at && !b.checkin_at) return a.name.localeCompare(b.name)
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
  }, [guests, sortOrder, statusFilter, debouncedSearchTerm])

  const guestsPresentCount = useMemo(() => {
    return guests.filter((guest) => guest.status === 'Presente').length
  }, [guests])
  
  const handleWalkinSuccess = () => {
    setIsWalkinDialogOpen(false)
    queryClient.invalidateQueries({ queryKey })
  }

  const handleDownload = async () => {
    if (!eventId) return;
    setIsDownloading(true);
    toast.info('A preparar a sua folha de cálculo...');
    try {
      const response = await api.get(`/festa/${eventId}/convidados/download`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `convidados_festa_${eventId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('O download da folha de cálculo foi iniciado!');
    } catch (err) {
      console.error('Erro ao baixar a folha de cálculo:', err);
      toast.error('Não foi possível baixar a folha de cálculo. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

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
              <span>A carregar detalhes...</span>
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
            <Badge variant="secondary">Total: {guests.length}</Badge>
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
                <SelectItem value="name_asc">Ordenar por Ordem Alfabética (Padrão)</SelectItem>
                <SelectItem value="status">Ordenar por Status</SelectItem>
                <SelectItem value="checkin_time_desc">Ordenar por Recém-chegados</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isWalkinDialogOpen} onOpenChange={setIsWalkinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 flex-1 min-w-[240px]">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Convidado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Convidado Extra</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do responsável e dos convidados.
                  </DialogDescription>
                </DialogHeader>
                <WalkinGuestRegistration onSuccess={handleWalkinSuccess} />
              </DialogContent>
            </Dialog>
            <Button onClick={handleDownload} disabled={isDownloading} variant="outline" className="h-11 flex-1 min-w-[240px]">
              {isDownloading ? (
                'A baixar...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Planilha
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <hr className="border-border" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <GuestCheckinCard
              key={`skeleton-${index}`}
              guest={null}
              onCheckin={() => {}}
              onCheckout={() => {}}
              isActionLoading={false}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedGuests.length > 0 ? (
            filteredAndSortedGuests.map((guest) => (
              <GuestCheckinCard
                key={guest.id}
                guest={guest}
                onCheckin={handleCheckin}
                onCheckout={handleCheckout}
                isActionLoading={isCheckinLoading === guest.id || isCheckoutLoading === guest.id}
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

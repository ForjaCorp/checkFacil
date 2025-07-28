import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, Loader2, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { SearchAndFilterBar } from '@/components/common/SearchAndFilterBar'
import { WalkinGuestRegistration } from '@/components/guests/WalkinGuestRegistration'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { useCheckinOperations } from '@/hooks/useCheckinOperations'
import { useDebounce } from '@/hooks/useDebounce'
import { usePageHeader } from '@/hooks/usePageHeader'

import api from '@/services/api'

import type { GuestType } from '@/types'

// -------------------------------
// Tipos e constantes
// -------------------------------
type StatusFilter = 'all' | 'Aguardando' | 'Presente' | 'Saiu'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'Aguardando', label: 'Aguardando' },
  { value: 'Presente', label: 'Presente' },
  { value: 'Saiu', label: 'Saiu' }
]

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

// -------------------------------
// Componente principal
// -------------------------------
export default function CheckinPage() {
  const queryClient = useQueryClient()
  const { setTitle } = usePageHeader()
  const { eventId = '' } = useParams<{ eventId: string }>()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { handleCheckin, handleCheckout, isCheckinLoading, isCheckoutLoading } = useCheckinOperations(eventId)

  const { data: eventData } = useQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId
  })

  const mapGuestData = (g: ApiGuestResponse): CheckinGuest => {
    let status: CheckinGuest['status'] = 'Aguardando'
    if (g.checkout_at) status = 'Saiu'
    else if (g.checkin_at) status = 'Presente'
    return {
      id: g.id,
      name: g.nome_convidado,
      status,
      walkedIn: g.cadastrado_na_hora || false,
      checkin_at: g.checkin_at || null,
      guestType: g.tipo_convidado,
      phoneNumber: g.telefone_convidado || g.telefone_responsavel_contato || null
    }
  }

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) return []
      const response = await api.get(`/festa/${eventId}/convidados`)
      return response.data.map(mapGuestData) as CheckinGuest[]
    },
    enabled: !!eventId
  })

  useEffect(() => {
    setTitle(`Check-in: ${eventData?.nome_festa || ''}`)
    return () => setTitle(null)
  }, [eventData, setTitle])

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchesSearch = guest.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || guest.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [guests, debouncedSearchTerm, statusFilter])

  const guestsPresentCount = useMemo(
    () => guests.filter((g) => g.status === 'Presente').length,
    [guests]
  )

  const handleWalkinSuccess = () => {
    setIsWalkinDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
  }

  const handleDownload = async () => {
    if (!eventId) return
    setIsDownloading(true)
    toast.info('A preparar a sua folha de cálculo...')
    try {
      const response = await api.get(`/festa/${eventId}/convidados/download`, {
        responseType: 'blob'
      })

      const contentDisposition = response.headers['content-disposition']
      let filename = `convidados_festa_${eventId}.xlsx`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/)
        if (match && match.length > 1) filename = match[1]
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('O download da folha de cálculo foi iniciado!')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível baixar a folha de cálculo.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Check-in</h1>
            <p className="text-muted-foreground">{eventData?.nome_festa || ''}</p>
            <div className="mt-1 flex gap-2">
              <Badge variant="default" className="bg-green-600 text-white">
                Presentes: {guestsPresentCount}
              </Badge>
              <Badge variant="secondary">Total: {guests.length}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="w-full flex-grow">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={STATUS_OPTIONS}
              selectedFilter={statusFilter}
              onFilterChange={(v) => setStatusFilter(v as StatusFilter)}
              searchPlaceholder="Buscar convidado..."
              filterPlaceholder="Status"
            />
          </div>
          <Dialog open={isWalkinDialogOpen} onOpenChange={setIsWalkinDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">+ Adicionar Convidado</Button>
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
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="outline"
            className="w-full md:w-auto"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar Planilha
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>A carregar convidados...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {guest.name}
                        {guest.walkedIn && (
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-600"
                          >
                            Extra
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {guest.status}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {guest.phoneNumber || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCheckin(guest.id)}
                          disabled={
                            guest.status !== 'Aguardando' ||
                            isCheckinLoading === guest.id
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={
                            guest.status !== 'Presente' ||
                            isCheckoutLoading === guest.id
                          }
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Check-out
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum convidado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
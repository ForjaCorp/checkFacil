import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Download, Check, LogOut, Edit } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SearchAndFilterBar } from '@/components/common/SearchAndFilterBar'
import { WalkinGuestRegistration } from '@/components/guests/WalkinGuestRegistration'
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'Aguardando', label: 'Aguardando' },
  { value: 'Presente', label: 'Presente' },
  { value: 'Saiu', label: 'Saiu' },
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

export default function CheckinPage() {
  const queryClient = useQueryClient()
  const { setTitle } = usePageHeader()
  const { eventId = '' } = useParams<{ eventId: string }>()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aguardando' | 'Presente' | 'Saiu'>('all')
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // estados observação
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [observationText, setObservationText] = useState('')

  // estados disparo
  const [isDisparoDialogOpen, setIsDisparoDialogOpen] = useState(false)
  const [disparoMensagem, setDisparoMensagem] = useState('')
  const [filtroDisparo, setFiltroDisparo] = useState<'Todos' | 'Presente' | 'Aguardando' | 'Saiu'>('Presente')
  const [isSending, setIsSending] = useState(false)

  const { handleCheckin, handleCheckout, isCheckinLoading, isCheckoutLoading } = useCheckinOperations(eventId)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: eventData } = useQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })

  useEffect(() => {
    setTitle(`Check-in: ${eventData?.nome_festa || ''}`)
    return () => setTitle(null)
  }, [eventData, setTitle])

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
      phoneNumber: g.telefone_convidado || g.telefone_responsavel_contato || null,
    }
  }

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) return []
      const response = await api.get(`/festa/${eventId}/convidados`)
      return response.data.map(mapGuestData) as CheckinGuest[]
    },
    enabled: !!eventId,
  })

  // 🔧 proteção contra undefined no name
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const nome = guest?.name || ''
      const matchesSearch = nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || guest.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [guests, debouncedSearchTerm, statusFilter])

  const guestsPresentCount = guests.filter((g) => g.status === 'Presente').length

  const handleWalkinSuccess = () => {
    setIsWalkinDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
  }

  const handleDownload = async () => {
    if (!eventId) return
    setIsDownloading(true)
    toast.info('A preparar a sua planilha...')
    try {
      const response = await api.get(`/festa/${eventId}/convidados/download`, {
        responseType: 'blob',
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

  const handleOpenObservation = (guestId: number) => {
    setSelectedGuestId(guestId)
    setObservationText('')
    setIsObservationDialogOpen(true)
  }

  const handleSaveObservation = async () => {
    if (!selectedGuestId || !eventId) return
    try {
      await api.patch(`/festa/${eventId}/convidados/${selectedGuestId}`, {
        observacao_convidado: observationText,
      })
      toast.success('Observação salva!')
      setIsObservationDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    } catch (err) {
      console.error('Erro ao salvar observação:', err)
      toast.error('Falha ao salvar observação.')
    }
  }

  const handleDispararMensagem = async () => {
    if (!eventId) return
    if (!disparoMensagem.trim()) {
      toast.error('Digite uma mensagem antes de enviar.')
      return
    }
    setIsSending(true)
    try {
      await api.post(`/festa/${eventId}/disparar-mensagem`, { mensagem: disparoMensagem, filtro: filtroDisparo })
      toast.success('Mensagem disparada!')
      setIsDisparoDialogOpen(false)
      setDisparoMensagem('')
    } catch (err) {
      console.error('Erro ao disparar mensagem:', err)
      toast.error('Falha ao disparar mensagens.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Check-in</h1>
            <p className="text-muted-foreground">{eventData?.nome_festa || ''}</p>
            <div className="mt-1 flex flex-wrap gap-2">
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
              onFilterChange={(v) => setStatusFilter(v as any)}
              searchPlaceholder="Buscar convidado..."
              filterPlaceholder="Status"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Dialog open={isWalkinDialogOpen} onOpenChange={setIsWalkinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">+ Adicionar Convidado</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Convidado Extra</DialogTitle>
                  <DialogDescription>Preencha os dados do responsável e dos convidados.</DialogDescription>
                </DialogHeader>
                <WalkinGuestRegistration onSuccess={handleWalkinSuccess} />
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Baixar Planilha
            </Button>
            <Button
              onClick={() => setIsDisparoDialogOpen(true)}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              📲 Disparar mensagem
            </Button>
          </div>
        </div>
      </div>

      {/* tabela */}
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
                <TableHead>Nome do Convidado</TableHead>
                <TableHead>Status</TableHead>
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
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Extra
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{guest.status}</TableCell>
                    <TableCell className="hidden sm:table-cell">{guest.phoneNumber || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenObservation(guest.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCheckin(guest.id)}
                          disabled={guest.status !== 'Aguardando' || isCheckinLoading === guest.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={guest.status !== 'Presente' || isCheckoutLoading === guest.id}
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

      {/* modal observação */}
      <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
            <DialogDescription>Adicione ou edite observações sobre este convidado.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={observationText}
            onChange={(e) => setObservationText(e.target.value)}
            placeholder="Digite a observação aqui..."
            className="mt-2"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsObservationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveObservation}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* modal disparo */}
      <Dialog open={isDisparoDialogOpen} onOpenChange={setIsDisparoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disparar mensagem</DialogTitle>
            <DialogDescription>Esta mensagem será enviada via WhatsApp.</DialogDescription>
          </DialogHeader>

          {/* Select filtro */}
          <Select value={filtroDisparo} onValueChange={(val) => setFiltroDisparo(val as any)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecione o status para envio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Presente">Presente</SelectItem>
              <SelectItem value="Aguardando">Aguardando</SelectItem>
              <SelectItem value="Saiu">Saiu</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            value={disparoMensagem}
            onChange={(e) => setDisparoMensagem(e.target.value)}
            placeholder="Digite a mensagem que será enviada..."
            className="mt-2"
          />
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDisparoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDispararMensagem} disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

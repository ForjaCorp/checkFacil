import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Download, Check, LogOut, Edit } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

// UI Components
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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
  observacao_convidado?: string | null
  acompanhado_por_id?: number | null // <-- ADICIONE ESTA LINHA
}

interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
  walkedIn: boolean
  checkin_at: string | null
  guestType: GuestType
  phoneNumber: string | null
  observacao?: string | null
  acompanhado_por_id?: number | null // <-- ADICIONE ESTA LINHA
  dependentes?: CheckinGuest[] // <-- Para facilitar agrupamento
  isOrphan?: boolean // <-- Permite identificar dependentes sem responsável
}

export default function CheckinPage() {
  const queryClient = useQueryClient()
  const { setTitle } = usePageHeader()
  const { eventId = '' } = useParams<{ eventId: string }>()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aguardando' | 'Presente' | 'Saiu'>(
    'all',
  )
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // estados observação
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [observationText, setObservationText] = useState('')

  // estados disparo
  const [isDisparoDialogOpen, setIsDisparoDialogOpen] = useState(false)
  const [disparoMensagem, setDisparoMensagem] = useState(
    'Cantamos os parabéns a pouco e todos estão curtindo muito.',
  )
  const [filtroDisparo, setFiltroDisparo] = useState<'Todos' | 'Presente' | 'Aguardando' | 'Saiu'>(
    'Presente',
  )
  const [isSending, setIsSending] = useState(false)

  const { handleCheckin, handleCheckout, isCheckinLoading, isCheckoutLoading } =
    useCheckinOperations(eventId)
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

  // Update page title when event data is loaded
  useEffect(() => {
    setTitle(`Check-in: ${eventData?.nome_festa || ''}`)
    return () => setTitle(null)
  }, [eventData, setTitle])

  // Update message with event end time when event data is loaded
  useEffect(() => {
    if (eventData?.horario_fim) {
      // Format time to show only hours and minutes (HH:MM)
      const formattedTime = eventData.horario_fim.split(':').slice(0, 2).join(':')
      setDisparoMensagem(
        `Cantamos os parabéns a pouco e todos estão curtindo muito. A festinha será finalizada às ${formattedTime}!`,
      )
    }
  }, [eventData?.horario_fim])

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
      observacao: g.observacao_convidado || '',
      acompanhado_por_id: g.acompanhado_por_id || null,
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

  // Agrupa responsáveis e dependentes, mas só com os filtrados
  const groupGuests = (guests: CheckinGuest[]) => {
    const responsaveis = guests.filter(g => !g.acompanhado_por_id)
    const dependentes = guests.filter(g => g.acompanhado_por_id)
    const dependentesPorResponsavel: Record<number, CheckinGuest[]> = {}
    dependentes.forEach(dep => {
      if (!dependentesPorResponsavel[dep.acompanhado_por_id!]) {
        dependentesPorResponsavel[dep.acompanhado_por_id!] = []
      }
      dependentesPorResponsavel[dep.acompanhado_por_id!].push(dep)
    })
    // Se não houver responsáveis (ex: filtro só mostra crianças), mostre só os dependentes
    if (responsaveis.length === 0 && dependentes.length > 0) {
      return dependentes.map(dep => ({
        ...dep,
        dependentes: [],
        isOrphan: true, // flag para renderização
      }))
    }
    return responsaveis.map(responsavel => ({
      ...responsavel,
      dependentes: dependentesPorResponsavel[responsavel.id] || [],
    }))
  }

  const groupedGuests = useMemo(() => groupGuests(filteredGuests), [filteredGuests])

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
    // Buscar observação do convidado selecionado
    const guest = guests.find((g) => g.id === guestId)
    setObservationText(guest?.observacao || '')
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
      await api.post(`/festa/${eventId}/disparar-mensagem`, {
        mensagem: disparoMensagem,
        filtro: filtroDisparo,
      })
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
    <div className="container mx-auto p-4 md:p-6 space-y-6 text-base"> {/* <-- Adicione text-base aqui */}
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Check-in</h1>
            <p className="text-muted-foreground text-lg">{eventData?.nome_festa || ''}</p> {/* <-- text-lg */}
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="default" className="bg-green-600 text-white text-base">
                Presentes: {guestsPresentCount}
              </Badge>
              <Badge variant="secondary" className="text-base">Total: {guests.length}</Badge>
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
              className="w-full sm:w-auto"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
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

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden text-base"> {/* <-- text-base */}
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
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedGuests.length > 0 ? (
                groupedGuests.map((responsavel) =>
                  responsavel.isOrphan ? (
                    // Criança sem responsável: linha normal, sem "(Responsável)"
                    <TableRow key={responsavel.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {responsavel.name}
                          <span className="ml-2 text-xs text-muted-foreground">(Criança)</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{responsavel.status}</TableCell>
                      <TableCell className="hidden sm:table-cell">{responsavel.phoneNumber || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-3 sm:gap-4 flex-nowrap overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleOpenObservation(responsavel.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleCheckin(responsavel.id)}
                            disabled={responsavel.status !== 'Aguardando'}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="w-8 h-8"
                            variant="destructive"
                            onClick={() => handleCheckout(responsavel.id)}
                            disabled={responsavel.status !== 'Presente'}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <React.Fragment key={responsavel.id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {responsavel.name}
                              {responsavel.walkedIn && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                  Extra
                                </Badge>
                              )}
                              <span className="ml-2 text-xs text-muted-foreground">(Responsável)</span>
                            </div>
                            <div className="sm:hidden text-sm text-muted-foreground">
                              <span>Status: {responsavel.status}</span>
                              <br />
                              <span>Telefone: {responsavel.phoneNumber || '-'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{responsavel.status}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {responsavel.phoneNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-3 sm:gap-4 flex-nowrap overflow-hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleOpenObservation(responsavel.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleCheckin(responsavel.id)}
                              disabled={responsavel.status !== 'Aguardando'}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              className="w-8 h-8"
                              variant="destructive"
                              onClick={() => handleCheckout(responsavel.id)}
                              disabled={responsavel.status !== 'Presente'}
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Dependentes */}
                      {responsavel.dependentes && responsavel.dependentes.map((dep) => (
                        <TableRow key={dep.id} className="bg-muted/50">
                          <TableCell className="pl-12">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">↳</span>
                              {dep.name}
                              <span className="ml-2 text-xs text-muted-foreground">(Criança)</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{dep.status}</TableCell>
                          <TableCell className="hidden sm:table-cell">{dep.phoneNumber || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-3 sm:gap-4 flex-nowrap overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => handleOpenObservation(dep.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="w-8 h-8"
                                disabled
                                title="Check-in pelo responsável"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                className="w-8 h-8"
                                variant="destructive"
                                onClick={() => handleCheckout(dep.id)}
                                disabled={dep.status !== 'Presente'}
                              >
                                <LogOut className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )
                )
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

      {/* Modal Disparo de Mensagem */}
      <Dialog open={isDisparoDialogOpen} onOpenChange={setIsDisparoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disparar mensagem</DialogTitle>
            <DialogDescription>Esta mensagem será enviada via WhatsApp.</DialogDescription>
          </DialogHeader>

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

      {/* Modal Observação do Convidado */}
      <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Observação do convidado</DialogTitle>
          </DialogHeader>
          <Textarea
            value={observationText}
            onChange={(e) => setObservationText(e.target.value)}
            placeholder="Digite uma observação para este convidado..."
            className="mt-2"
          />
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsObservationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveObservation}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

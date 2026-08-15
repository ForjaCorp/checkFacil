import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Download, Check, LogOut, Edit, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

// UI Components
import { GuestTabs } from '@/components/guests/GuestTabs'
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
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'Aguardando', label: 'Aguardando' },
  { value: 'Presente', label: 'Presente' },
  { value: 'Saiu', label: 'Saiu' },
]

const TIPOS_CRIANCA = ['CRIANCA_PAGANTE', 'CRIANCA_ATE_1_ANO'];

// Função auxiliar para checar se um tipo de convidado é criança
const isCrianca = (tipoConvidado: string) => TIPOS_CRIANCA.includes(tipoConvidado);

// Descreve o formato dos dados EXATOS que vêm da sua API
interface ApiGuestResponse {
  id: number;
  nome_convidado: string;
  checkin_at?: string | null;
  checkout_at?: string | null;
  cadastrado_na_hora?: boolean;
  tipo_convidado: string; // Vem como string, ex: 'CRIANCA_PAGANTE'
  telefone_convidado?: string | null;
  telefone_responsavel_contato?: string | null;
  observacao_convidado?: string | null;
  acompanhado_por_id?: number | null; // O campo chave que liga a criança ao responsável!
}

// Descreve o formato que usaremos DENTRO do nosso componente
interface CheckinGuest {
  id: number;
  name: string;
  status: 'Aguardando' | 'Presente' | 'Saiu';
  walkedIn: boolean;
  checkin_at: string | null;
  guestType: string;
  phoneNumber: string | null;
  observacao?: string | null;
  isChild: boolean;
  responsibleId?: number | null;
  children?: CheckinGuest[]; // <-- Adicione esta linha
}

export default function CheckinPage() {
  const queryClient = useQueryClient()
  const { setTitle } = usePageHeader()
  const { eventId = '' } = useParams<{ eventId: string }>()

  const [activeTab, setActiveTab] = useState<'todos' | 'criancas' | 'adultos'>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aguardando' | 'Presente' | 'Saiu'>(
    'all',
  )
  const [isWalkinDialogOpen, setIsWalkinDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleStatusFilterChange = (value: string) => {
    if (value === 'all' || value === 'Aguardando' || value === 'Presente' || value === 'Saiu') {
      setStatusFilter(value)
      return
    }

    setStatusFilter('all')
  }

  const handleFiltroDisparoChange = (value: string) => {
    if (value === 'Todos' || value === 'Presente' || value === 'Aguardando' || value === 'Saiu') {
      setFiltroDisparo(value)
      return
    }

    setFiltroDisparo('Presente')
  }

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


  const {
    handleCheckin,
    handleCheckout,
    handleGroupCheckin,  // <-- Adicionar
    handleGroupCheckout, // <-- Adicionar
    isCheckinLoading,
    isCheckoutLoading
  } = useCheckinOperations(eventId)
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

      // --- Linhas importantes que garantem a tradução correta ---
      isChild: isCrianca(g.tipo_convidado),
      responsibleId: g.acompanhado_por_id || null,

      // Deixamos a propriedade children vazia por enquanto, ela será preenchida depois
      children: [],
    }
  }

  /**
   * Transforma uma lista plana de convidados em uma lista agrupada,
   * onde as crianças ficam dentro de um array 'children' de seus responsáveis.
   */

  const groupGuests = (guests: CheckinGuest[]): CheckinGuest[] => {
    const guestsMap = new Map(
      guests.map(guest => [guest.id, { ...guest, children: [] as CheckinGuest[] }])
    );

    const rootGuests: CheckinGuest[] = [];

    guestsMap.forEach(guest => {
      // IF PRINCIPAL: O convidado é uma criança com responsável?
      if (guest.isChild && guest.responsibleId) {
        const responsible = guestsMap.get(guest.responsibleId);

        // IF ANINHADO: Encontramos o responsável na lista?
        if (responsible) {
          // SIM: Adiciona a criança na lista de filhos do responsável.
          responsible.children?.push(guest);
        } else {
          // NÃO: A criança é "órfã" (o pai não está na lista), então a mostramos na lista principal.
          rootGuests.push(guest);
        }
      } else {
        // ELSE PRINCIPAL: Não é uma criança com responsável, então é um adulto/responsável.
        rootGuests.push(guest);
      }
    });

    return rootGuests;
  };


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
  // Use `useMemo` para agrupar e filtrar os convidados de forma otimizada
  const groupedAndFilteredGuests = useMemo(() => {
    // Primeiro, agrupa a lista de convidados vinda da API
    const grouped = groupGuests(guests);

    // Depois, aplica a lógica de filtro
    return grouped.filter(guest => {
      // 1. Filtro por Aba (Todos / Adultos / Crianças)
      const isGuestChild = !!guest.isChild;
      const groupHasChildren = guest.children && guest.children.length > 0;
      
      if (activeTab === 'criancas') {
         // Aba Crianças: Mostra se for criança na raiz OU se o grupo contiver crianças
         if (!isGuestChild && !groupHasChildren) return false;
      } else if (activeTab === 'adultos') {
         // Aba Adultos: Esconde se for criança na raiz (mesmo que órfã, pois é aba adultos)
         // Mas mostra adultos (pais) mesmo que tenham filhos.
         if (isGuestChild) return false;
      }
      // Se activeTab === 'todos', não filtra nada por tipo

      const parentName = guest.name || '';
      // Checa se o convidado principal (pai/adulto) corresponde à busca
      const parentMatchesSearch = parentName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const parentMatchesStatus = statusFilter === 'all' || guest.status === statusFilter;

      // Se o pai corresponde à busca E ao status, mostra o grupo inteiro (pai + filhos)
      if (parentMatchesSearch && parentMatchesStatus) return true;

      // Se o pai não corresponde, verifica se ALGUM dos filhos corresponde
      const childMatches = guest.children?.some(child => {
        const childName = child.name || '';
        const childMatchesSearch = childName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const childMatchesStatus = statusFilter === 'all' || child.status === statusFilter;
        return childMatchesSearch && childMatchesStatus;
      });

      // Se algum filho corresponder, mostra o grupo inteiro também
      return childMatches;
    });
  }, [guests, debouncedSearchTerm, statusFilter, activeTab]);


  const guestsPresentCount = guests.filter((g) => g.status === 'Presente').length
  const todosCount = guests.length
  const criancasCount = guests.filter((g) => g.isChild).length
  const adultosCount = guests.filter((g) => !g.isChild).length

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
        statusAlvo: filtroDisparo === 'Todos' ? undefined : filtroDisparo,
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

  const handleToggleRow = (guestId: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(guestId)) {
      newSet.delete(guestId);
    } else {
      newSet.add(guestId);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="container mx-auto p-4 md-p-6 space-y-6 text-base">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Check-in</h1>
            <p className="text-muted-foreground text-lg">{eventData?.nome_festa || ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-600 text-white text-base px-3 py-1">
              Presentes: {guestsPresentCount}
            </Badge>
            <Badge variant="secondary" className="text-base px-3 py-1">Total: {guests.length}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <GuestTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            counts={{
              todos: todosCount,
              adultos: adultosCount,
              criancas: criancasCount
            }}
            className="w-full"
          />

          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar convidado..."
                  className="pl-8 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[180px]">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Dialog open={isWalkinDialogOpen} onOpenChange={setIsWalkinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                     + Convidado
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

              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                className="w-full sm:w-auto bg-white"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Planilha
              </Button>
              <Button
                onClick={() => setIsDisparoDialogOpen(true)}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                📲 Mensagem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden text-base">
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
              {(() => {
                let guestCounter = 1;

                return groupedAndFilteredGuests.length > 0 ? (
                  groupedAndFilteredGuests.map((guest) => (
                    <Fragment key={guest.id}>
                      {/* --- LINHA DO RESPONSÁVEL / CONVIDADO PRINCIPAL --- */}
                      <TableRow className={guest.children && guest.children.length > 0 ? 'border-b-0' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {guest.children && guest.children.length > 0 ? (
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => handleToggleRow(guest.id)}>
                                {expandedRows.has(guest.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            ) : (
                              <div className="w-8"></div>
                            )}

                            <span className="w-8 text-right text-sm text-muted-foreground pr-2 tabular-nums">{guestCounter++}.</span>

                            <Popover>
                              <PopoverTrigger asChild>
                                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] cursor-pointer hover:underline decoration-dotted underline-offset-4">
                                  {guest.name}
                                </span>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                <p className="text-sm font-medium">{guest.name}</p>
                              </PopoverContent>
                            </Popover>

                            {guest.walkedIn && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600 shrink-0">Extra</Badge>
                            )}
                          </div>
                          <div className="pl-16 sm:hidden text-sm text-muted-foreground">
                            <span>Status: {guest.status}</span><br />
                            <span>Telefone: {guest.phoneNumber || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{guest.status}</TableCell>
                        <TableCell className="hidden sm:table-cell">{guest.phoneNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-3 sm:gap-4 flex-nowrap">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleOpenObservation(guest.id)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" className="w-8 h-8" onClick={() => handleCheckin(guest.id)} disabled={guest.status !== 'Aguardando' || isCheckinLoading === guest.id}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" className="w-8 h-8" variant="destructive" onClick={() => handleCheckout(guest.id)} disabled={guest.status !== 'Presente' || isCheckoutLoading === guest.id}><LogOut className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* --- LINHAS DAS CRIANÇAS --- */}
                      {expandedRows.has(guest.id) &&
                        guest.children?.map((child) => (
                          <TableRow key={child.id} className="bg-muted/50 hover:bg-muted/80" style={{ borderTop: 0 }}>
                            <TableCell className="pl-12 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="w-8 text-right text-sm text-muted-foreground pr-2 tabular-nums">{guestCounter++}.</span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] cursor-pointer hover:underline decoration-dotted underline-offset-4">
                                      {child.name}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <p className="text-sm font-medium">{child.name}</p>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="pl-12 sm:hidden text-sm text-muted-foreground">
                                <span>Status: {child.status}</span><br />
                                <span>Telefone: {child.phoneNumber || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{child.status}</TableCell>
                            <TableCell className="hidden sm:table-cell">{child.phoneNumber || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-3 sm:gap-4 flex-nowrap">
                                {/* Botão de Observação (não muda) */}
                                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleOpenObservation(guest.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>

                                {/* Botão de Check-in INTELIGENTE */}
                                <Button
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => {
                                    // Se o convidado tem filhos, chama a função de grupo. Senão, a individual.
                                    if (guest.children && guest.children.length > 0) {
                                      handleGroupCheckin(guest.id);
                                    } else {
                                      handleCheckin(guest.id);
                                    }
                                  }}
                                  disabled={guest.status !== 'Aguardando' || isCheckinLoading === guest.id}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>

                                {/* Botão de Check-out INTELIGENTE */}
                                <Button
                                  size="icon"
                                  className="w-8 h-8"
                                  variant="destructive"
                                  onClick={() => {
                                    // Mesma lógica: se tem filhos, chama a função de grupo.
                                    if (guest.children && guest.children.length > 0) {
                                      handleGroupCheckout(guest.id);
                                    } else {
                                      handleCheckout(guest.id);
                                    }
                                  }}
                                  disabled={guest.status !== 'Presente' || isCheckoutLoading === guest.id}
                                >
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum convidado encontrado.
                    </TableCell>
                  </TableRow>
                );
              })()}
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

          <Select value={filtroDisparo} onValueChange={handleFiltroDisparoChange}>
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

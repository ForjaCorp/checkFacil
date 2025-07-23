import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

// UI Components
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { SearchAndFilterBar } from '@/components/common/SearchAndFilterBar'
import { ShareInviteLink } from '@/components/events/ShareInviteLink'
import { GuestCard } from '@/components/guests/GuestCard'
import { GuestForm } from '@/components/guests/GuestForm'
// UI Components
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// Hooks
import { useGuestOperations } from '@/hooks/useGuestOperations'
import { usePageHeader } from '@/hooks/usePageHeader'
// Schemas
import { type EditGuestFormValues } from '@/schemas/guestSchemas'
// Services
import api from '@/services/api'

// Types & Constants
import type { AppGuest, GuestType, GuestFilterOptions } from '@/types/guest'

// Guest type options for the filter dropdown
const GUEST_TYPE_OPTIONS: GuestFilterOptions[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'ADULTO_PAGANTE', label: 'Adulto' },
  { value: 'CRIANCA_PAGANTE', label: 'Criança' },
  { value: 'CRIANCA_ATE_1_ANO', label: 'Bebê' },
  { value: 'BABA', label: 'Babá' },
  { value: 'ANFITRIAO_FAMILIA_DIRETA', label: 'Família' },
  { value: 'ACOMPANHANTE_ATIPICO', label: 'Acompanhante' },
]

function GuestManagementPage() {
  const { setTitle } = usePageHeader()
  const { eventId = '' } = useParams<{ eventId: string }>()

  const [searchTerm, setSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState<'all' | GuestType>('all')
  const [editingGuest, setEditingGuest] = useState<AppGuest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<AppGuest | null>(null)

  const { editGuest, deleteGuest, isEditing, isDeleting } = useGuestOperations(eventId)

  const { data: guests = [], isLoading } = useQuery<AppGuest[]>({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) return []
      const response = await api.get(`/festa/${eventId}/convidados`)
      return response.data
    },
    enabled: !!eventId,
  })

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })

  useEffect(() => {
    setTitle('Gerenciar Convidados')
    return () => setTitle(null)
  }, [setTitle])

  const partyName = eventData?.nome_festa || ''

  const handleEditGuestSubmit = (formData: EditGuestFormValues) => {
    if (!editingGuest) return

    const isChild = formData.tipo_convidado?.includes('CRIANCA') || false
    const submitData: Partial<EditGuestFormValues> = {
      nome_convidado: formData.nome_convidado || '', // Ensure required field is not undefined
      tipo_convidado: formData.tipo_convidado,
      e_crianca_atipica: formData.e_crianca_atipica ?? false,
      nascimento_convidado: null,
    }

    // Add fields based on guest type
    if (isChild) {
      submitData.nome_responsavel = formData.nome_responsavel || null
      submitData.telefone_responsavel = formData.telefone_responsavel?.replace(/\D/g, '') || null
    } else {
      submitData.telefone_convidado = formData.telefone_convidado?.replace(/\D/g, '') || null
    }

    // Se existir data de nascimento, converte para Date
    if (formData.nascimento_convidado) {
      const date =
        formData.nascimento_convidado instanceof Date
          ? formData.nascimento_convidado
          : new Date(formData.nascimento_convidado)

      if (!isNaN(date.getTime())) {
        submitData.nascimento_convidado = date
      }
    }

    // Create an object with the fields that will actually be sent
    const dataToSend: EditGuestFormValues = {
      ...submitData,
      // Ensure required fields are present
      nome_convidado: submitData.nome_convidado || '',
      // Ensure e_crianca_atipica is always boolean
      e_crianca_atipica: Boolean(submitData.e_crianca_atipica),
      // Ensure all optional fields are present
      telefone_convidado: submitData.telefone_convidado || null,
      telefone_responsavel: submitData.telefone_responsavel || null,
      telefone_acompanhante: null,
      nome_responsavel: submitData.nome_responsavel || null,
      nome_acompanhante: null,
      tipo_convidado: submitData.tipo_convidado || 'ADULTO_PAGANTE'
    }

    // Usa o mutate para enviar os dados
    editGuest(
      {
        guestId: editingGuest.id,
        data: dataToSend,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
        },
        onError: (error) => {
          console.error('Erro ao atualizar convidado:', error)
        },
      },
    )
  }

  const confirmDeleteGuest = () => {
    if (guestToDelete) {
      deleteGuest(guestToDelete.id)
      setGuestToDelete(null)
    }
  }

  // Tipo compatível com o componente GuestCard
  type GuestCardGuest = {
    id: number
    nome_convidado: string
    tipo_convidado: string
    e_crianca_atipica?: boolean
    status?: string
    isCheckedIn?: boolean
    nascimento_convidado?: string | Date | null
    // Campos de telefone
    telefone_convidado?: string | null
    telefone_responsavel_contato?: string | null
    // Campos de compatibilidade
    telefone_responsavel?: string | null
    nome_responsavel_contato?: string | null
    nome_responsavel?: string | null
    checkin_at?: string | null
    checkout_at?: string | null
  }

  const handleEditClick = (guest: GuestCardGuest) => {
    const isChild = guest.tipo_convidado === 'crianca'
    
    // Converte o guest para AppGuest, garantindo a tipagem correta
    const guestData: AppGuest = {
      id: guest.id,
      nome_convidado: guest.nome_convidado,
      tipo_convidado: guest.tipo_convidado as GuestType,
      e_crianca_atipica: guest.e_crianca_atipica ?? false,
      status: 'Aguardando',
      isCheckedIn: false,
      nascimento_convidado: null,
      checkin_at: null,
      checkout_at: null,
      cadastrado_na_hora: false,
      // Mapeia os campos de telefone apropriados para o tipo de convidado
      ...(isChild
        ? {
            // Para crianças: usa campos do responsável
            nome_responsavel_contato: guest.nome_responsavel_contato || guest.nome_responsavel || null,
            telefone_responsavel_contato: guest.telefone_responsavel_contato || guest.telefone_responsavel || null,
          }
        : {
            // Para adultos: usa telefone do convidado
            telefone_convidado: guest.telefone_convidado || null,
          }),
      // Mantém campos de compatibilidade
      nome_responsavel: guest.nome_responsavel_contato || guest.nome_responsavel || null,
      telefone_responsavel: guest.telefone_responsavel_contato || guest.telefone_responsavel || null,
    } as AppGuest

    // Se existir data de nascimento, garante que seja um Date válido
    if (guest.nascimento_convidado) {
      guestData.nascimento_convidado =
        guest.nascimento_convidado instanceof Date
          ? guest.nascimento_convidado
          : new Date(guest.nascimento_convidado)
    }

    setEditingGuest(guestData)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (guest: GuestCardGuest) => {
    setGuestToDelete({
      ...guest,
      status: 'Aguardando',
      isCheckedIn: false,
    } as unknown as AppGuest)
  }

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchesSearch = guest.nome_convidado.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = guestTypeFilter === 'all' || guest.tipo_convidado === guestTypeFilter
      return matchesSearch && matchesType
    })
  }, [guests, searchTerm, guestTypeFilter])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciar Convidados</h1>
            <p className="text-muted-foreground">{partyName}</p>
          </div>
          {eventId && <ShareInviteLink eventId={eventId} />}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterOptions={GUEST_TYPE_OPTIONS}
            selectedFilter={guestTypeFilter}
            onFilterChange={(value) => setGuestTypeFilter(value as 'all' | GuestType)}
            searchPlaceholder="Buscar convidado..."
            filterPlaceholder="Tipo de convidado"
            className="md:col-span-2 lg:col-span-1"
          />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Convidado</DialogTitle>
            <DialogDescription>
              Altere os dados abaixo e clique em &quot;Salvar Alterações&quot;.
            </DialogDescription>
          </DialogHeader>
          {editingGuest && (
            <GuestForm
              onSubmit={handleEditGuestSubmit}
              isLoading={isEditing}
              initialValues={{
                nome_convidado: editingGuest.nome_convidado || '',
                tipo_convidado: editingGuest.tipo_convidado || '',
                nascimento_convidado: editingGuest.nascimento_convidado || null,
                e_crianca_atipica: editingGuest.e_crianca_atipica ?? false,
                // Usa o campo de telefone do convidado (para adultos)
                telefone_convidado: editingGuest.telefone_convidado || '',
                // Usa o campo de telefone do responsável (para crianças)
                telefone_responsavel: editingGuest.telefone_responsavel || '',
                // Usa o campo de telefone do acompanhante (opcional para crianças)
                telefone_acompanhante: editingGuest.telefone_acompanhante || '',
                // Usa o campo de nome do responsável (para crianças)
                nome_responsavel: editingGuest.nome_responsavel || '',
                // Usa o campo de nome do acompanhante (opcional para crianças)
                nome_acompanhante: editingGuest.nome_acompanhante || '',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Carregando convidados...</span>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center p-12 space-y-4">
          <p className="text-muted-foreground">
            {searchTerm || guestTypeFilter !== 'all'
              ? 'Nenhum convidado encontrado com os filtros atuais.'
              : 'Nenhum convidado cadastrado ainda.'}
          </p>
          {(searchTerm || guestTypeFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('')
                setGuestTypeFilter('all')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 8 }).map((_, index) => (
              <GuestCard
                key={`skeleton-${index}`}
                guest={null}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isActionLoading={false}
                isLoading={true}
              />
            ))
          ) : (
            // Show actual guest cards when data is loaded
            filteredGuests.map((guest) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isActionLoading={isDeleting}
                isLoading={false}
              />
            ))
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!guestToDelete}
        onClose={() => setGuestToDelete(null)}
        onConfirm={confirmDeleteGuest}
        title="Remover Convidado"
        description={
          guestToDelete
            ? `Tem certeza que deseja remover ${guestToDelete.nome_convidado}? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja remover este convidado? Esta ação não pode ser desfeita.'
        }
        confirmText="Remover Convidado"
        cancelText="Cancelar"
        isConfirming={isDeleting}
      />
    </div>
  )
}

export default GuestManagementPage

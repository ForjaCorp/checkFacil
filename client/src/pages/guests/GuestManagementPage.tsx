import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ActionButton } from '@/components/common/ActionButton'
import { ShareInviteLink } from '@/components/events/ShareInviteLink'
import { GuestForm } from '@/components/guests/GuestForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageHeader } from '@/hooks/usePageHeader'
import { type EditGuestFormValues } from '@/schemas/guestSchemas'
import api from '@/services/api'

import type { AppGuest } from '@/types'

const getGuestTypeFriendlyName = (type: string) => {
  const names: { [key: string]: string } = {
    ADULTO_PAGANTE: 'Adulto',
    CRIANCA_PAGANTE: 'Criança',
    CRIANCA_ATE_1_ANO: 'Criança (até 1 ano)',
    BABA: 'Babá',
    ANFITRIAO_FAMILIA_DIRETA: 'Anfitrião/Família',
    ACOMPANHANTE_ATIPICO: 'Acompanhante',
  }
  return names[type] || type
}

function GuestManagementPage() {
  const { setTitle } = usePageHeader()
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()

  const [editingGuest, setEditingGuest] = useState<AppGuest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<AppGuest | null>(null)

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
    if (eventData) {
      setTitle(`Convidados: ${eventData.nome_festa}`)
    } else {
      setTitle('Gerenciar Convidados')
    }
    return () => setTitle(null)
  }, [eventData, setTitle])

  const partyName = eventData?.nome_festa || ''

  const { mutate: editGuest, isPending: isEditing } = useMutation({
    mutationFn: (updatedGuest: EditGuestFormValues) =>
      api.patch(`/festa/${eventId}/convidados/${editingGuest?.id}`, updatedGuest),

    onMutate: async (updatedGuest) => {
      setIsEditDialogOpen(false)
      await queryClient.cancelQueries({ queryKey: ['guests', eventId] })
      const previousGuests = queryClient.getQueryData<AppGuest[]>(['guests', eventId])

      queryClient.setQueryData<AppGuest[]>(['guests', eventId], (old = []) =>
        old.map((guest) => (guest.id === editingGuest?.id ? { ...guest, ...updatedGuest } : guest)),
      )

      return { previousGuests }
    },
    onError: (_err, _updatedGuest, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(['guests', eventId], context.previousGuests)
      }
      toast.error('Falha ao salvar alterações.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    },
  })

  const { mutate: deleteGuest, isPending: isDeleting } = useMutation({
    mutationFn: () => api.delete(`/festa/${eventId}/convidados/${guestToDelete?.id}`),

    onMutate: async () => {
      if (!guestToDelete) return
      setGuestToDelete(null)
      await queryClient.cancelQueries({ queryKey: ['guests', eventId] })
      const previousGuests = queryClient.getQueryData<AppGuest[]>(['guests', eventId])

      queryClient.setQueryData<AppGuest[]>(['guests', eventId], (old = []) =>
        old.filter((guest) => guest.id !== guestToDelete.id),
      )

      return { previousGuests }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(['guests', eventId], context.previousGuests)
      }
      toast.error('Falha ao remover convidado.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    },
  })

  function handleEditGuestSubmit(data: EditGuestFormValues) {
    if (!editingGuest) return
    editGuest(data)
  }

  function confirmDeleteGuest() {
    deleteGuest()
  }

  const handleEditClick = (guest: AppGuest) => {
    setEditingGuest(guest)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (guest: AppGuest) => {
    setGuestToDelete(guest)
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="hidden text-3xl font-bold text-foreground lg:block">
            Gerenciar Convidados
          </h1>
          {partyName && <p className="text-lg text-muted-foreground">{partyName}</p>}
        </div>
        {eventId && <ShareInviteLink eventId={eventId} />}
      </header>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <h3 className="text-lg font-semibold">Editar Convidado</h3>
            </DialogTitle>
            <DialogDescription>
              Altere os dados abaixo e clique em &quot;Salvar Alterações&quot;.
            </DialogDescription>
          </DialogHeader>
          {editingGuest && (
            <GuestForm
              onSubmit={handleEditGuestSubmit}
              isLoading={isEditing}
              initialValues={{
                nome_convidado: editingGuest.nome_convidado,
                tipo_convidado: editingGuest.tipo_convidado,
                nascimento_convidado: editingGuest.nascimento_convidado,
                e_crianca_atipica: editingGuest.e_crianca_atipica ?? false,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-bold">
              Lista de Convidados
              </h2>
              </CardTitle>
          <CardDescription>Acompanhe, edite ou remova os convidados confirmados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : guests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Convidado</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.nome_convidado}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {getGuestTypeFriendlyName(guest.tipo_convidado)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {guest.nome_responsavel || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Pencil}
                          tooltip="Editar Convidado"
                          onClick={() => handleEditClick(guest)}
                        />
                        <ActionButton
                          icon={Trash2}
                          tooltip="Remover Convidado"
                          variant="destructive"
                          onClick={() => handleDeleteClick(guest)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum convidado adicionado a esta festa ainda.
            </p>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!guestToDelete}
        onOpenChange={(isOpen) => !isOpen && setGuestToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover permanentemente o convidado
              <strong className="mx-1">{guestToDelete?.nome_convidado}</strong>
              da lista desta festa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGuestToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGuest}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, deletar convidado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GuestManagementPage

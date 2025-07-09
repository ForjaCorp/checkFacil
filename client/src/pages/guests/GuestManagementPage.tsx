import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AddGuestForm } from '@/components/guests/AddGuestForm'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import api from '@/services/api'

import type { AddGuestFormValues } from '@/schemas/guestSchemas'
import type { AppGuest } from '@/types'

function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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

  const partyName = eventData?.nome_festa || ''

  const { mutate: addGuest, isPending: isAdding } = useMutation({
    mutationFn: (newGuest: AddGuestFormValues) =>
      api.post(`/festa/${eventId}/convidados`, newGuest),

    onMutate: async (newGuest) => {
      setIsAddDialogOpen(false) // Fecha o modal imediatamente
      await queryClient.cancelQueries({ queryKey: ['guests', eventId] })
      const previousGuests = queryClient.getQueryData<AppGuest[]>(['guests', eventId])

      queryClient.setQueryData<AppGuest[]>(['guests', eventId], (old = []) => [
        ...old,
        { id: Date.now(), ...newGuest, status: 'PENDENTE', isCheckedIn: false },
      ])

      return { previousGuests }
    },
    onError: (_err, _newGuest, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(['guests', eventId], context.previousGuests)
      }
      toast.error('Falha ao adicionar convidado.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
    },
  })

  const { mutate: editGuest, isPending: isEditing } = useMutation({
    mutationFn: (updatedGuest: AddGuestFormValues) =>
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
      setGuestToDelete(null) // Fecha o diálogo de confirmação
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

  function handleAddGuestSubmit(data: AddGuestFormValues) {
    addGuest(data)
  }

  function handleEditGuestSubmit(data: AddGuestFormValues) {
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
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Convidados</h1>
          {partyName && <p className="text-lg text-muted-foreground">{partyName}</p>}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-4 sm:w-auto sm:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Convidados
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Convidado</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para adicionar um novo convidado à lista.
              </DialogDescription>
            </DialogHeader>
            <AddGuestForm onSubmit={handleAddGuestSubmit} isLoading={isAdding} mode="add" />
          </DialogContent>
        </Dialog>
      </header>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Convidado</DialogTitle>
            <DialogDescription>
              Altere os dados abaixo e clique em &quot;Salvar Alterações&quot;.
            </DialogDescription>
          </DialogHeader>
          {editingGuest && (
            <AddGuestForm
              onSubmit={handleEditGuestSubmit}
              isLoading={isEditing}
              initialValues={{
                nome_convidado: editingGuest.nome_convidado,
                tipo_convidado: editingGuest.tipo_convidado,
                nascimento_convidado: editingGuest.nascimento_convidado,
                e_crianca_atipica: editingGuest.e_crianca_atipica ?? false,
                telefone_convidado: editingGuest.telefone_convidado ?? '',
                nome_responsavel: editingGuest.nome_responsavel ?? '',
                telefone_responsavel: editingGuest.telefone_responsavel ?? '',
                nome_acompanhante: editingGuest.nome_acompanhante ?? '',
                telefone_acompanhante: editingGuest.telefone_acompanhante ?? '',
                observacao_convidado: editingGuest.observacao_convidado ?? '',
              }}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Convidados</CardTitle>
          <CardDescription>Visualize e gerencie os convidados da sua festa.</CardDescription>
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
                      {guest.tipo_convidado}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {guest.nome_responsavel || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(guest)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(guest)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
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

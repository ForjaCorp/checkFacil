import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { useApiMutation } from '@/hooks/useApiMutation'
import api from '@/services/api'

import type { AddGuestFormValues } from '@/schemas/guestSchemas'
import type { ApiGuestResponse, AppGuest } from '@/types'

function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<AppGuest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [partyName, setPartyName] = useState('')

  // Estados para controlar os modais
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<AppGuest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<AppGuest | null>(null)

  const fetchGuests = useCallback(async () => {
    if (!eventId) return
    try {
      const response = await api.get(`/festa/${eventId}/convidados`)
      const mappedGuests: AppGuest[] = response.data.map((guestFromApi: ApiGuestResponse) => ({
        id: guestFromApi.id,
        nome_convidado: guestFromApi.nome_convidado,
        tipo_convidado: guestFromApi.tipo_convidado,
        nascimento_convidado: guestFromApi.nascimento_convidado
          ? new Date(guestFromApi.nascimento_convidado.replace(/-/g, '/'))
          : null,
        e_crianca_atipica: guestFromApi.e_crianca_atipica,
        telefone_convidado: guestFromApi.telefone_convidado,
        nome_responsavel: guestFromApi.nome_responsavel,
        telefone_responsavel: guestFromApi.telefone_responsavel,
        nome_acompanhante: guestFromApi.nome_acompanhante,
        telefone_acompanhante: guestFromApi.telefone_acompanhante,
        observacao_convidado: guestFromApi.observacao_convidado,
        status: guestFromApi.confirmou_presenca,
        isCheckedIn: !!guestFromApi.checkin_at,
      }))
      setGuests(mappedGuests)
    } catch (error) {
      console.error('Erro ao buscar convidados:', error)
      toast.error('Não foi possível carregar a lista de convidados.')
    }
  }, [eventId])

  // Busca os dados iniciais
  useEffect(() => {
    if (!eventId) return
    const fetchInitialData = async () => {
      setIsLoading(true)
      await fetchGuests()
      try {
        const eventResponse = await api.get(`/festa/${eventId}`)
        setPartyName(eventResponse.data.nome_festa)
      } catch {
        toast.error('Não foi possível carregar o nome da festa.')
      }
      setIsLoading(false)
    }
    fetchInitialData()
  }, [eventId, fetchGuests])

  const { mutate: addGuest, isLoading: isAdding } = useApiMutation(
    (data: AddGuestFormValues) => api.post(`/festa/${eventId}/convidados`, data),
    'Convidado adicionado com sucesso!',
    {
      onSuccess: () => {
        fetchGuests()
        setIsAddDialogOpen(false)
      },
    },
  )

  const { mutate: editGuest, isLoading: isEditing } = useApiMutation(
    (data: AddGuestFormValues) =>
      api.patch(`/festa/${eventId}/convidados/${editingGuest?.id}`, data),
    'Convidado atualizado com sucesso!',
    {
      onSuccess: () => {
        fetchGuests()
        setIsEditDialogOpen(false)
        setEditingGuest(null)
      },
    },
  )

  const { mutate: deleteGuest, isLoading: isDeleting } = useApiMutation(
    () => api.delete(`/festa/${eventId}/convidados/${guestToDelete?.id}`),
    `Convidado removido com sucesso!`,
    {
      onSuccess: () => {
        fetchGuests()
        setGuestToDelete(null)
      },
    },
  )

  const handleAddGuestSubmit = async (data: AddGuestFormValues) => {
    try {
      await addGuest(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleEditGuestSubmit = async (data: AddGuestFormValues) => {
    if (!editingGuest) return
    try {
      await editGuest(data)
    } catch (error) {
      console.error(error)
    }
  }

  const confirmDeleteGuest = async () => {
    if (!guestToDelete) return
    try {
      await deleteGuest(undefined)
    } catch (error) {
      console.error(error)
    }
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Convidado</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para adicionar um novo convidado à lista.
              </DialogDescription>
            </DialogHeader>
            <AddGuestForm onSubmit={handleAddGuestSubmit} isLoading={isAdding} mode="add" />{' '}
          </DialogContent>
        </Dialog>
      </header>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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

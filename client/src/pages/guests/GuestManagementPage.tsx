import axios from 'axios'
import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AddGuestForm, type AddGuestFormValues } from '@/components/guests/AddGuestForm'
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

interface ApiGuestResponse {
  id: number
  nome_convidado: string
  tipo_convidado:
    | 'ADULTO_PAGANTE'
    | 'CRIANCA_PAGANTE'
    | 'CRIANCA_ATE_1_ANO'
    | 'BABA'
    | 'ANFITRIAO_FAMILIA_DIRETA'
    | 'ACOMPANHANTE_ATIPICO'
  data_nascimento?: string | null
  e_crianca_atipica?: boolean
  telefone_convidado?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  nome_acompanhante?: string | null
  telefone_acompanhante?: string | null
  observacao_convidado?: string | null
  confirmou_presenca: 'PENDENTE' | 'SIM' | 'NAO'
  checkin_at?: string | null
}

interface AppGuest {
  id: number
  nome_convidado: string
  tipo_convidado: ApiGuestResponse['tipo_convidado']
  data_nascimento?: Date | null
  e_crianca_atipica?: boolean
  telefone_convidado?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  nome_acompanhante?: string | null
  telefone_acompanhante?: string | null
  observacao_convidado?: string | null
  status: 'PENDENTE' | 'SIM' | 'NAO'
  isCheckedIn: boolean
}

function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<AppGuest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [partyName, setPartyName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
        data_nascimento: guestFromApi.data_nascimento
          ? new Date(guestFromApi.data_nascimento.replace(/-/g, '/'))
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
  }, [eventId]) // Dependência do useCallback

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
  }, [eventId, fetchGuests]) // Adicionado fetchGuests como dependência

  // Função para lidar com a submissão do formulário
  const handleAddGuestSubmit = async (data: AddGuestFormValues) => {
    // TIPO CORRIGIDO AQUI
    if (!eventId) return
    setIsSubmitting(true)
    try {
      await api.post(`/festa/${eventId}/convidados`, data)
      toast.success('Convidado adicionado com sucesso!')
      setIsDialogOpen(false)
      await fetchGuests() // Atualiza a lista
    } catch (error: unknown) {
      let errorMessage = 'Ocorreu um erro inesperado.'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          'Erro ao processar a solicitação.'
      } else if (error instanceof Error) {
        // Se for um erro genérico do JavaScript, pegamos a mensagem
        errorMessage = error.message
      }
      toast.error('Falha ao adicionar convidado.', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (guest: AppGuest) => {
    setEditingGuest(guest)
    setIsEditDialogOpen(true)
  }

  const handleEditGuestSubmit = async (data: AddGuestFormValues) => {
    if (!editingGuest || !eventId) return

    setIsSubmitting(true)
    try {
      // Chama o endpoint PATCH para atualizar o convidado
      await api.patch(
        `/festa/<span class="math-inline">\{eventId\}/convidados/</span>{editingGuest.id}`,
        data,
      )
      toast.success('Convidado atualizado com sucesso!')
      setIsEditDialogOpen(false) // Fecha o modal
      setEditingGuest(null) // Limpa o estado de edição
      await fetchGuests() // Atualiza a lista
    } catch (error: unknown) {
      // Use 'unknown' em vez de 'any'
      let errorMessage = 'Ocorreu um erro inesperado.'

      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          'Erro ao processar a solicitação.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Falha ao atualizar convidado.', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (guest: AppGuest) => {
    setGuestToDelete(guest) // Guarda o convidado que queremos deletar
  }

  const confirmDeleteGuest = async () => {
    if (!guestToDelete || !eventId) return

    // Podemos reusar o estado 'isSubmitting' para o loading do botão de deletar
    setIsSubmitting(true)
    try {
      // Chama o endpoint DELETE
      await api.delete(`/festa/${eventId}/convidados/${guestToDelete.id}`)
      toast.success(`Convidado "${guestToDelete.nome_convidado}" removido com sucesso!`)

      await fetchGuests() // Atualiza a lista na tela
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || 'Por favor, tente novamente.')
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Ocorreu um erro inesperado.')
      }
    } finally {
      setIsSubmitting(false)
      setGuestToDelete(null) // Fecha o diálogo limpando o estado
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Convidados</h1>
          {partyName && <p className="text-lg text-muted-foreground">{partyName}</p>}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <AddGuestForm onSubmit={handleAddGuestSubmit} isLoading={isSubmitting} mode="add" />
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
              isLoading={isSubmitting}
              initialValues={{
                nome_convidado: editingGuest.nome_convidado,
                tipo_convidado: editingGuest.tipo_convidado,
                data_nascimento: editingGuest.data_nascimento,
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
              disabled={isSubmitting}
              className="bg-destructive"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, deletar convidado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GuestManagementPage

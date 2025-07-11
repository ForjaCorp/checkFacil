import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Music2, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ActionButton } from '@/components/common/ActionButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaylistForm } from '@/components/playlists/PlaylistForm'
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
import { type PlaylistFormValues } from '@/schemas/playlistSchemas'
import api from '@/services/api'

interface Playlist {
  id: number
  nome: string
  link: string
}

export default function PlaylistManagementPage() {
  const { setTitle } = usePageHeader()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null)
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setTitle('Gerenciar Playlists')
    return () => setTitle(null)
  }, [setTitle])

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ['playlists'],
    queryFn: async () => {
      const response = await api.get('/playlists')
      return response.data
    },
  })

  const { mutate: createPlaylist, isPending: isCreating } = useMutation({
    mutationFn: (data: PlaylistFormValues) => api.post('/playlists', data),
    onSuccess: () => {
      toast.success('Playlist criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      setIsFormOpen(false)
    },
    onError: () => toast.error('Falha ao criar playlist.'),
  })

  const { mutate: updatePlaylist, isPending: isUpdating } = useMutation({
    mutationFn: (data: PlaylistFormValues) => api.patch(`/playlists/${playlistToEdit?.id}`, data),
    onSuccess: () => {
      toast.success('Playlist atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      setIsFormOpen(false)
    },
    onError: () => toast.error('Falha ao atualizar playlist.'),
  })

  const { mutate: deletePlaylist, isPending: isDeleting } = useMutation({
    mutationFn: () => api.delete(`/playlists/${playlistToDelete?.id}`),
    onSuccess: () => {
      toast.success('Playlist removida com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      setPlaylistToDelete(null)
    },
    onError: () => toast.error('Falha ao remover playlist.'),
  })

  const handleFormSubmit = (data: PlaylistFormValues) => {
    if (playlistToEdit) {
      updatePlaylist(data)
    } else {
      createPlaylist(data)
    }
  }

  const openCreateDialog = () => {
    setPlaylistToEdit(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (playlist: Playlist, event: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget
    setPlaylistToEdit(playlist)
    setIsFormOpen(true)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Gerenciar Playlists"
        description="Adicione, edite ou remova as playlists pré-definidas para as festas."
      />

      <div className="w-full">
        <Button className="w-full" onClick={openCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Playlist
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Playlists Disponíveis</CardTitle>
          <CardDescription>
            Esta lista ficará visível para os clientes no momento de personalizar a festa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : playlists.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell className="font-medium">{playlist.nome}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a
                        href={playlist.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {playlist.link}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Pencil}
                          tooltip="Editar Playlist"
                          onClick={(e) => openEditDialog(playlist, e)}
                        />

                        <ActionButton
                          icon={Trash2}
                          tooltip="Remover Playlist"
                          variant="destructive"
                          onClick={(e) => {
                            triggerRef.current = e.currentTarget
                            setPlaylistToDelete(playlist)
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <Music2 className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma playlist cadastrada ainda.</p>
              <Button variant="outline" onClick={openCreateDialog}>
                Criar a primeira playlist
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen)
          if (!isOpen) {
            triggerRef.current?.focus()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {playlistToEdit ? 'Editar Playlist' : 'Adicionar Nova Playlist'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo. O link deve ser uma URL válida do Spotify.
            </DialogDescription>
          </DialogHeader>
          <PlaylistForm
            onSubmit={handleFormSubmit}
            isLoading={isCreating || isUpdating}
            initialValues={playlistToEdit ?? {}}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!playlistToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            triggerRef.current?.focus()
          }
          setPlaylistToDelete(isOpen ? playlistToDelete : null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A playlist{' '}
              <strong className="mx-1">{playlistToDelete?.nome}</strong>
              será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlaylist()}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

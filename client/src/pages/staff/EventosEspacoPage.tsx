import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { CalendarDays, CalendarPlus, EyeOff, ImagePlus, Loader2, Pencil, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/authContextCore'
import { usePageHeader } from '@/hooks/usePageHeader'
import { isAdminEmail } from '@/lib/adminEmails'
import api from '@/services/api'

interface EventoEspaco {
  id: number
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  imagem_url: string | null
  link_ingresso: string | null
  publicado: boolean
  createdAt: string
}

interface FormularioEvento {
  id: number | null
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  link_ingresso: string
}

const FORM_VAZIO: FormularioEvento = {
  id: null,
  titulo: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  link_ingresso: '',
}

const formatarData = (data: string) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

const periodoLabel = (evento: Pick<EventoEspaco, 'data_inicio' | 'data_fim'>) =>
  evento.data_fim && evento.data_fim !== evento.data_inicio
    ? `${formatarData(evento.data_inicio)} a ${formatarData(evento.data_fim)}`
    : formatarData(evento.data_inicio)

export default function EventosEspacoPage() {
  const { setTitle } = usePageHeader()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<FormularioEvento>(FORM_VAZIO)
  const [imagem, setImagem] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gestao e restrita aos titulares (mesmo padrao de "Administradores")
  const isSuperAdmin = isAdminEmail(user?.email)

  useEffect(() => {
    setTitle('Eventos do Espaço')
    return () => setTitle(null)
  }, [setTitle])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const { data: eventos = [], isLoading } = useQuery<EventoEspaco[]>({
    queryKey: ['eventos-espaco-admin'],
    queryFn: async () => {
      const response = await api.get('/eventos-espaco/admin')
      return response.data.eventos
    },
  })

  const { mutate: salvarEvento, isPending: isSaving } = useMutation({
    mutationFn: (dados: FormData) =>
      form.id ? api.put(`/eventos-espaco/${form.id}`, dados) : api.post('/eventos-espaco', dados),
    onSuccess: () => {
      toast.success(form.id ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['eventos-espaco-admin'] })
      fecharForm()
    },
    onError: (error: AxiosError<{ error?: string }>) =>
      toast.error('Não foi possível salvar o evento.', {
        description: error.response?.data?.error,
      }),
  })

  const { mutate: alternarPublicacao, isPending: isToggling } = useMutation({
    mutationFn: (id: number) => api.post(`/eventos-espaco/${id}/publicar`),
    onSuccess: (response) => {
      toast.success(response.data?.mensagem ?? 'Estado de publicação atualizado.')
      queryClient.invalidateQueries({ queryKey: ['eventos-espaco-admin'] })
    },
    onError: (error: AxiosError<{ error?: string }>) =>
      toast.error('Falha ao alterar a publicação.', { description: error.response?.data?.error }),
  })

  const { mutate: excluirEvento, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/eventos-espaco/${id}`),
    onSuccess: () => {
      toast.success('Evento excluído.')
      queryClient.invalidateQueries({ queryKey: ['eventos-espaco-admin'] })
    },
    onError: (error: AxiosError<{ error?: string }>) =>
      toast.error('Não foi possível excluir.', { description: error.response?.data?.error }),
  })

  const abrirNovo = () => {
    setForm(FORM_VAZIO)
    setImagem(null)
    setPreview(null)
    setIsFormOpen(true)
  }

  const abrirEdicao = (evento: EventoEspaco) => {
    setForm({
      id: evento.id,
      titulo: evento.titulo,
      descricao: evento.descricao ?? '',
      data_inicio: evento.data_inicio?.slice(0, 10) ?? '',
      data_fim: evento.data_fim?.slice(0, 10) ?? '',
      link_ingresso: evento.link_ingresso ?? '',
    })
    setImagem(null)
    setPreview(null)
    setIsFormOpen(true)
  }

  const fecharForm = () => {
    setIsFormOpen(false)
    setImagem(null)
    setPreview(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.data_inicio) {
      toast.error('Preencha o título e a data de início.')
      return
    }
    if (form.data_fim && form.data_fim < form.data_inicio) {
      toast.error('A data final não pode ser anterior à inicial.')
      return
    }

    const dados = new FormData()
    dados.append('titulo', form.titulo.trim())
    dados.append('descricao', form.descricao.trim())
    dados.append('data_inicio', form.data_inicio)
    if (form.data_fim) dados.append('data_fim', form.data_fim)
    if (form.link_ingresso.trim()) dados.append('link_ingresso', form.link_ingresso.trim())
    if (imagem) dados.append('imagem', imagem)

    salvarEvento(dados)
  }

  const escolherImagem = (arquivo: File | undefined) => {
    if (!arquivo) return
    if (arquivo.size > 4 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 4 MB.')
      return
    }
    setImagem(arquivo)
    setPreview(URL.createObjectURL(arquivo))
  }

  // Guard depois dos hooks para manter a ordem de execucao do React.
  if (!isSuperAdmin) {
    return <Navigate to="/staff/dashboard" replace />
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Eventos do Espaço"
        description="Colônia de férias, dia das mães, dia das crianças... crie, publique e divulgue."
      />

      <div className="w-full">
        <Button className="w-full" onClick={abrirNovo}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Criar Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Cadastrados</CardTitle>
          <CardDescription>
            Publicar torna o evento visível e envia uma notificação aos clientes que ativaram os avisos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : eventos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum evento criado ainda.
            </p>
          ) : (
            <ul className="divide-y">
              {eventos.map((evento) => (
                <li key={evento.id} className="flex flex-wrap items-center gap-3 py-3">
                  {evento.imagem_url ? (
                    <img
                      src={evento.imagem_url}
                      alt={evento.titulo}
                      className="h-10 w-14 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{evento.titulo}</p>
                    <p className="truncate text-sm text-muted-foreground">{periodoLabel(evento)}</p>
                  </div>
                  <Badge variant={evento.publicado ? 'default' : 'secondary'} className="shrink-0">
                    {evento.publicado ? 'Publicado' : 'Rascunho'}
                  </Badge>
                  <div className="ml-auto flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
                    <Button
                      variant={evento.publicado ? 'outline' : 'default'}
                      size="sm"
                      title={evento.publicado ? 'Despublicar' : 'Publicar'}
                      disabled={isToggling || isDeleting}
                      onClick={() => alternarPublicacao(evento.id)}
                    >
                      {evento.publicado ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Despublicar
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publicar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar evento"
                      disabled={isSaving || isDeleting}
                      onClick={() => abrirEdicao(evento)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir evento"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          disabled={isToggling || isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`"${evento.titulo}" será removido definitivamente, junto com sua imagem.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => excluirEvento(evento.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(aberto) => (aberto ? setIsFormOpen(true) : fecharForm())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar Evento' : 'Criar Evento'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do evento do espaço. Ele nasce como rascunho — publique quando
              estiver pronto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evento-titulo">Título</Label>
              <Input
                id="evento-titulo"
                placeholder="Ex: Colônia de Férias Julho 2026"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evento-inicio">Data de início</Label>
                <Input
                  id="evento-inicio"
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento-fim">Data final (opcional)</Label>
                <Input
                  id="evento-fim"
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evento-link">Link de compra — Sympla (opcional)</Label>
              <Input
                id="evento-link"
                type="url"
                placeholder="https://www.sympla.com.br/..."
                value={form.link_ingresso}
                onChange={(e) => setForm({ ...form, link_ingresso: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evento-descricao">Descrição</Label>
              <Textarea
                id="evento-descricao"
                placeholder="Faixa etária, o que está incluso, valores..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem de divulgação (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => escolherImagem(e.target.files?.[0])}
              />
              <div className="flex items-center gap-3">
                {preview || form.id === null ? (
                  preview && <img src={preview} alt="Pré-visualização" className="h-16 w-24 rounded-md object-cover" />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {imagem ? 'Trocar imagem' : 'Escolher imagem'}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

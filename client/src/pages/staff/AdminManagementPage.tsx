import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePageHeader } from '@/hooks/usePageHeader'
import { isAdminEmail } from '@/lib/adminEmails'
import api from '@/services/api'

import { useAuth } from '@/contexts/authContextCore'

interface AdmEspaco {
  id: number
  nome: string
  email: string
  telefone: string | null
  createdAt: string
}

export default function AdminManagementPage() {
  const { setTitle } = usePageHeader()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  // Visivel apenas para os emails de admin do .env (mesmo padrao do menu "Criar Festa")
  const isSuperAdmin = isAdminEmail(user?.email)

  useEffect(() => {
    setTitle('Administradores')
    return () => setTitle(null)
  }, [setTitle])

  const { data: adms = [], isLoading } = useQuery<AdmEspaco[]>({
    queryKey: ['adms-espaco'],
    queryFn: async () => {
      const response = await api.get('/auth/adms')
      return response.data.adms
    },
  })

  const { mutate: convidarAdm, isPending: isInviting } = useMutation({
    mutationFn: (dados: { nome: string; email: string; telefone: string }) =>
      api.post('/auth/adms/convidar', dados),
    onSuccess: (response) => {
      if (response.data?.whatsappEnviado) {
        toast.success('Administrador convidado! Link de senha enviado via WhatsApp.')
      } else {
        toast.warning('Administrador criado, mas o WhatsApp falhou.', {
          description:
            response.data?.aviso ?? 'O convite pode ser reenviado pela tela da festa depois.',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['adms-espaco'] })
      setIsFormOpen(false)
      setNome('')
      setEmail('')
      setTelefone('')
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      toast.error('Falha ao convidar administrador.', {
        description: error.response?.data?.error ?? 'Tente novamente em instantes.',
      })
    },
  })

  const { mutate: redefinirSenha, isPending: isResetting } = useMutation({
    mutationFn: (id: number) => api.post(`/auth/adms/${id}/redefinir-senha`),
    onSuccess: () => toast.success('Link de redefinição enviado pelo WhatsApp.'),
    onError: (error: AxiosError<{ error?: string }>) =>
      toast.error('Não foi possível enviar o link.', { description: error.response?.data?.error }),
  })

  const { mutate: excluirAdm, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/adms/${id}`),
    onSuccess: () => {
      toast.success('Administrador excluído.')
      queryClient.invalidateQueries({ queryKey: ['adms-espaco'] })
    },
    onError: (error: AxiosError<{ error?: string }>) =>
      toast.error('Não foi possível excluir.', { description: error.response?.data?.error }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      toast.error('Preencha nome, e-mail e telefone.')
      return
    }
    convidarAdm({ nome: nome.trim(), email: email.trim(), telefone: telefone.trim() })
  }

  // Guarda depois dos hooks para manter a ordem de execução do React.
  if (!isSuperAdmin) {
    return <Navigate to="/staff/dashboard" replace />
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Administradores do Espaço"
        description="Gerencie quem tem acesso ao painel completo do espaço."
      />

      <div className="w-full">
        <Button className="w-full" onClick={() => setIsFormOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Administrador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe com Acesso Completo</CardTitle>
          <CardDescription>
            Administradores criam festas, fazem check-in e disparam mensagens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ul className="divide-y">
              {adms.map((adm) => (
                <li key={adm.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{adm.nome}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {adm.email}
                      {adm.telefone ? ` · ${adm.telefone}` : ''}
                    </p>
                  </div>
                  {isAdminEmail(adm.email) ? (
                    <Badge>Titular</Badge>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant="outline" className="hidden sm:inline-flex">Admin</Badge>
                      <Button
                        variant="ghost" size="icon" title="Enviar redefinição de senha"
                        disabled={isResetting || isDeleting}
                        onClick={() => redefinirSenha(adm.id)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir administrador"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={isResetting || isDeleting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir administrador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {adm.nome} perderá o acesso ao painel. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => excluirAdm(adm.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Administrador</DialogTitle>
            <DialogDescription>
              A pessoa receberá um link via WhatsApp para definir a própria senha
              (válido por 48 horas).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adm-nome">Nome</Label>
              <Input
                id="adm-nome"
                placeholder="Ex: Maria Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adm-email">E-mail</Label>
              <Input
                id="adm-email"
                type="email"
                placeholder="maria@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adm-telefone">Telefone (WhatsApp)</Label>
              <Input
                id="adm-telefone"
                placeholder="(86) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isInviting ? 'Enviando convite...' : 'Criar e enviar convite'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

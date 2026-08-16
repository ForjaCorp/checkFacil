import { Camera, KeyRound, Loader2, LogOut, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { PushNotificationsCard } from '@/components/layout/PushNotificationsCard'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/authContextCore'
import { usePageHeader } from '@/hooks/usePageHeader'
import { isAdminEmail } from '@/lib/adminEmails'
import { unformatPhoneNumber } from '@/lib/phoneUtils'
import api from '@/services/api'

/**
 * Profile page component.
 *
 * This component is used to render the user's profile page.
 * It shows the user's avatar, name, and email.
 * It also provides a button to log out the user.
 *
 * @returns The profile page component.
 */
export default function ProfilePage() {
  const { setTitle } = usePageHeader()
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nome, setNome] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [telefone, setTelefone] = useState(unformatPhoneNumber(user?.phone ?? ''))
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    setTitle('Meu Perfil')
    return () => setTitle(null)
  }, [setTitle])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: async () => {
      const dados = new FormData()
      dados.append('nome', nome.trim())
      dados.append('email', email.trim())
      dados.append('telefone', unformatPhoneNumber(telefone))
      if (foto) dados.append('foto', foto)
      return api.put('/auth/me', dados)
    },
    onSuccess: ({ data }) => {
      updateUser({
        name: data.usuario.nome, email: data.usuario.email,
        phone: data.usuario.telefone, photoUrl: data.usuario.fotoUrl,
      })
      setFoto(null)
      setPreview(null)
      toast.success('Perfil atualizado com sucesso.')
    },
    onError: (error: unknown) => toast.error('Não foi possível atualizar o perfil.', {
      description: axios.isAxiosError(error) ? error.response?.data?.error : undefined,
    }),
  })

  const { mutate: redefinirSenha, isPending: isRedefinindo } = useMutation({
    mutationFn: (telefone: string) => api.post('/auth/forgot-password', { telefone }),
    onSuccess: () => toast.success('Link de redefinição enviado no seu WhatsApp.'),
    onError: (error: unknown) => toast.error('Não foi possível enviar o link.', {
      description: axios.isAxiosError(error) ? error.response?.data?.error : undefined,
    }),
  })

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  if (!user) {
    return null
  }

  const userInitials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader title="Meu Perfil" description="Suas informações de conta." />

      <div className="mx-auto w-full max-w-2xl">
        {/* Cabecalho com capa + identidade */}
        <Card className="overflow-hidden">
          <div className="relative h-20 w-full bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 sm:h-24">
            <img
              src="/espacocriar-logo.png"
              alt="Logo do espaço"
              className="absolute inset-0 m-auto h-12 object-contain opacity-90 sm:h-14"
            />
          </div>
          <CardContent className="relative px-4 pb-4 sm:px-6">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-3 sm:-mt-12">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-card sm:h-24 sm:w-24">
                  <AvatarImage src={preview ?? user.photoUrl ?? undefined} alt={`Avatar de ${user.name}`} />
                  <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  title="Alterar foto"
                  aria-label="Alterar foto"
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm transition-transform hover:scale-110"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(event) => {
                    const arquivo = event.target.files?.[0]
                    if (!arquivo) return
                    if (arquivo.size > 2 * 1024 * 1024) return toast.error('A foto deve ter no máximo 2 MB.')
                    setFoto(arquivo)
                    setPreview(URL.createObjectURL(arquivo))
                  }} />
              </div>

              <div className="flex gap-2 pb-1">
                {isAdminEmail(user.email) && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/staff/admins')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Administradores
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>

            <div className="mt-3 min-w-0">
              <h2 className="truncate text-lg font-semibold leading-tight">{user.name}</h2>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados cadastrados */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados cadastrados</CardTitle>
            <CardDescription>Atualize suas informações de contato.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); salvar() }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="perfil-nome">Nome</Label>
                  <Input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={isPending} /></div>
                <div className="space-y-2"><Label htmlFor="perfil-telefone">Telefone</Label>
                  <PhoneInput
                    id="perfil-telefone"
                    placeholder="+55 (XX) 9XXXX-XXXX"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="perfil-email">E-mail</Label>
                <Input id="perfil-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} /></div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                  disabled={isRedefinindo || !unformatPhoneNumber(telefone)}
                  onClick={() => redefinirSenha(unformatPhoneNumber(telefone))}
                >
                  <span>••••••••</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    {isRedefinindo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <KeyRound className="h-3.5 w-3.5" />
                    Redefinir senha
                  </span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Envia um link de redefinição para o WhatsApp do seu telefone cadastrado.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || !nome.trim() || !email.trim()}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4">
          <PushNotificationsCard />
        </div>
      </div>
    </div>
  )
}

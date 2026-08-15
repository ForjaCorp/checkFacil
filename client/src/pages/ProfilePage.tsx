import { Camera, Loader2, LogOut, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/authContextCore'
import { usePageHeader } from '@/hooks/usePageHeader'
import { isAdminEmail } from '@/lib/adminEmails'
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
  const [telefone, setTelefone] = useState(user?.phone ?? '')
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
      dados.append('telefone', telefone.trim())
      if (foto) dados.append('foto', foto)
      return api.put('/auth/me', dados)
    },
    onSuccess: ({ data }) => {
      updateUser({
        name: data.usuario.nome, email: data.usuario.email,
        phone: data.usuario.telefone, photoUrl: data.usuario.fotoUrl,
      })
      setFoto(null)
      toast.success('Perfil atualizado com sucesso.')
    },
    onError: (error: unknown) => toast.error('Não foi possível atualizar o perfil.', {
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
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Meu Perfil" description="Suas informações de conta." />

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={preview ?? user.photoUrl ?? undefined} alt={`Avatar de ${user.name}`} />
            <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(event) => {
              const arquivo = event.target.files?.[0]
              if (!arquivo) return
              if (arquivo.size > 2 * 1024 * 1024) return toast.error('A foto deve ter no máximo 2 MB.')
              setFoto(arquivo)
              setPreview(URL.createObjectURL(arquivo))
            }} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Camera className="mr-2 h-4 w-4" /> Alterar foto
          </Button>
        </CardHeader>

        <CardContent className="mt-4">
          <Separator />
          <form className="space-y-4 py-6" onSubmit={(event) => { event.preventDefault(); salvar() }}>
            <div className="space-y-2"><Label htmlFor="perfil-nome">Nome</Label>
              <Input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={isPending} /></div>
            <div className="space-y-2"><Label htmlFor="perfil-email">E-mail</Label>
              <Input id="perfil-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} /></div>
            <div className="space-y-2"><Label htmlFor="perfil-telefone">Telefone</Label>
              <Input id="perfil-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={isPending} /></div>
            <Button type="submit" className="w-full" disabled={isPending || !nome.trim() || !email.trim()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar alterações
            </Button>
          </form>
          <Separator />
          <div className="pt-6 flex flex-col gap-3">
            {/* Acesso mobile a gestao de administradores (menu fica na sidebar no desktop) */}
            {isAdminEmail(user.email) && (
              <Button variant="outline" className="w-full" onClick={() => navigate('/staff/admins')}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Gerenciar Administradores
              </Button>
            )}
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

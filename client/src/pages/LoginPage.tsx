import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth, type AuthenticatedUser } from '@/contexts/authContextCore'
import { useApiMutation } from '@/hooks/useApiMutation'
import api from '@/services/api'

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória.' })
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
})
type LoginFormValues = z.infer<typeof loginFormSchema>

function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const dashboardPath =
        auth.user.userType === 'Adm_espaco' ? '/staff/dashboard' : '/organizer/dashboard'
      navigate(dashboardPath, { replace: true })
    }
  }, [auth.isAuthenticated, auth.user, navigate])

  const { mutate: login, isLoading } = useApiMutation(
    (credentials: LoginFormValues) =>
      api.post('/auth/login', {
        email: credentials.email,
        senha: credentials.password,
      }),
    '',
    {
      onSuccess: (data) => {
        const { usuario, token } = data.data
        const authenticatedUserData: AuthenticatedUser = {
          id: usuario.id.toString(),
          email: usuario.email,
          name: usuario.nome,
          userType: usuario.tipoUsuario,
        }
        auth.login(authenticatedUserData, token)
      },
    },
  )

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    await login(values)
  }

  if (auth.initialLoading || auth.isAuthenticated) {
    return <div className="h-screen w-full bg-primary" />
  }

  return (
    // Layout principal com fundo roxo e centralizado
    <div className="w-full h-full flex flex-col items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {/* Espaço reservado para a logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          {/* Título e descrição genéricos e acolhedores */}
          <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>Use seu email e senha para entrar no painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

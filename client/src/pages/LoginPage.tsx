import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth, type AuthenticatedUser } from '@/contexts/authContextCore'
import api from '@/services/api'

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória.' })
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
})

type LoginFormValues = z.infer<typeof loginFormSchema>

function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const { mutate: login, isPending } = useMutation({
    mutationFn: (credentials: LoginFormValues) =>
      api.post('/auth/login', {
        email: credentials.email,
        senha: credentials.password
      }),
    onSuccess: (data) => {
      const { usuario, token } = data.data
      const authenticatedUserData: AuthenticatedUser = {
        id: usuario.id.toString(),
        email: usuario.email,
        name: usuario.nome,
        userType: usuario.tipoUsuario
      }
      auth.login(authenticatedUserData, token)
    },
    onError: (error: unknown) => {
      const errorPayload = axios.isAxiosError(error) ? error.response?.data : undefined
      const errorStatus = axios.isAxiosError(error) ? error.response?.status : undefined

      console.error('Falha no login:', {
        message: axios.isAxiosError(error) ? error.message : 'Erro desconhecido',
        response: errorPayload,
        status: errorStatus,
      })

      const description =
        axios.isAxiosError(error) && typeof errorPayload?.error === 'string'
          ? errorPayload.error
          : 'Email ou senha inválidos.'

      toast.error('Falha no login', { description })
    }
  })

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const dashboardPath =
        auth.user.userType === 'Adm_espaco' ? '/staff/dashboard' : '/organizer/dashboard'
      navigate(dashboardPath, { replace: true })
    }
  }, [auth.isAuthenticated, auth.user, navigate])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  function onSubmit(values: LoginFormValues) {
    login(values)
  }

  if (auth.isAuthenticated) {
    return <div className="h-screen w-full bg-primary" />
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white">
            <img src="/espacocriar-logo.png" alt="Logo" className="h-24 w-24" />
          </div>
          <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>
            Use seu email e senha para entrar no painel.
          </CardDescription>
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
                      <Input placeholder="seu@email.com" {...field} disabled={isPending} />
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
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-6" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Entrando...' : 'Entrar'}
              </Button>

              {/* ✅ Botão de Esqueceu Senha */}
              <Button
                type="button"
                variant="link"
                className="w-full mt-2"
                onClick={() => navigate('/forgot-password')}
              >
                Esqueceu sua senha?
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

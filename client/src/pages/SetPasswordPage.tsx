import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { usePageHeader } from '@/hooks/usePageHeader'
import api from '@/services/api'

const setPasswordSchema = z
  .object({
    password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
    confirmPassword: z.string().min(6, { message: 'A confirmação de senha é obrigatória.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>

export default function SetPasswordPage() {
  const { setTitle } = usePageHeader()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    setTitle('Definir Nova Senha')
    return () => setTitle(null)
  }, [setTitle])

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const { mutate: setPassword, isPending } = useMutation({
    mutationFn: (payload: { token: string; novaSenha: string }) =>
      api.post('/auth/definir-senha', payload),
    onSuccess: () => {
      toast.success('Senha definida com sucesso!')
      toast.info('Agora você já pode fazer o login com sua nova senha.')
      navigate('/login')
    },
    onError: (error) => {
      console.error('Falha ao definir a senha:', error)
    },
  })

  function onSubmit(values: SetPasswordFormValues) {
    if (!token) {
      toast.error('Token de redefinição inválido ou não encontrado.')
      return
    }
    const payload = {
      token: token,
      novaSenha: values.password,
    }
    setPassword(payload)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Defina sua Senha</CardTitle>
          <CardDescription>Crie uma nova senha para acessar o painel da sua festa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme a Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? 'Salvando...' : 'Definir Senha e Acessar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

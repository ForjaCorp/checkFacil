import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, { message: 'O e-mail é obrigatório.' }).email('Insira um e-mail válido'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { mutate: solicitarLink, isPending } = useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      api.post('/auth/forgot-password', { email: values.email }),
    onSuccess: () => {
      toast.success('Enviamos o link de redefinição via WhatsApp!')
      navigate('/login')
    },
    onError: () => {
      toast.error('Falha ao solicitar redefinição.', {
        description: 'Verifique o e-mail informado e tente novamente.',
      })
    },
  })

  function onSubmit(values: ForgotPasswordValues) {
    solicitarLink(values)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu e-mail para receber o link de redefinição via WhatsApp.
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-6" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Voltar para login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

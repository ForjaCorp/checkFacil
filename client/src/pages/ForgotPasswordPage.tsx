import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import type { AxiosError } from 'axios'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

const forgotPasswordSchema = z.object({
  telefone: z
    .string()
    .min(1, { message: 'O telefone é obrigatório.' })
    .refine((v) => {
      const digitos = v.replace(/\D/g, '').replace(/^55/, '')
      return digitos.length >= 10 && digitos.length <= 11
    }, 'Informe um telefone válido com DDD. Ex: (86) 99999-9999'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

interface ApiErrorResponse {
  error?: string
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { telefone: '' },
  })

  const { mutate: solicitarLink, isPending } = useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      api.post('/auth/forgot-password', { telefone: values.telefone }),
    onSuccess: () => {
      toast.success('Enviamos o link de redefinição via WhatsApp!')
      navigate('/login')
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // 404: telefone nao encontrado | 502: falha no envio do WhatsApp (conexao Evolution)
      // 400: telefone invalido | outros: erro generico
      const status = error.response?.status
      const mensagem = error.response?.data?.error

      if (status === 502) {
        toast.error('Falha ao enviar pelo WhatsApp.', {
          description: mensagem ?? 'Verifique a conexão do WhatsApp e tente novamente.',
        })
        return
      }

      if (status === 404) {
        toast.error('Telefone não encontrado.', {
          description: mensagem ?? 'Nenhum usuário encontrado com este telefone.',
        })
        return
      }

      if (status === 400 && mensagem) {
        toast.error('Telefone inválido.', { description: mensagem })
        return
      }

      toast.error('Falha ao solicitar redefinição.', {
        description: mensagem ?? 'Tente novamente em instantes.',
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
            Digite seu telefone (com DDD) para receber o link de redefinição via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="(86) 99999-9999"
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

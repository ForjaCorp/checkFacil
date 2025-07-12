import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { PhoneInput } from '@/components/forms/PhoneInput'
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
import { brazilianPhoneSchema } from '@/lib/phoneUtils'
import { SuccessStep } from '@/pages/guest/steps/SuccessStep'
import api from '@/services/api'

const adultGuestSchema = z.object({
  adultos: z
    .array(
      z.object({
        nome: z.string().trim().min(3, { message: 'O nome é obrigatório (mínimo 3 letras).' }),
        telefone: brazilianPhoneSchema,
      }),
    )
    .min(1, 'Pelo menos um adulto deve ser informado.'),
})

type AdultGuestFormValues = z.infer<typeof adultGuestSchema>

export default function ConfirmAdultPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { setTitle } = usePageHeader()
  const [isSuccess, setIsSuccess] = useState(false)

  const { data: eventData } = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}/public`)
      return response.data
    },
    enabled: !!eventId,
  })

  useEffect(() => {
    if (eventData?.nome_festa) {
      setTitle(`Festa de ${eventData.nome_festa}`)
    }
    return () => setTitle(null)
  }, [eventData, setTitle])

  const form = useForm<AdultGuestFormValues>({
    resolver: zodResolver(adultGuestSchema),
    defaultValues: {
      adultos: [{ nome: '', telefone: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adultos',
  })

  const { mutate: confirmAttendance, isPending } = useMutation({
    mutationFn: (data: AdultGuestFormValues) => api.post(`/festa/${eventId}/register-adults`, data),
    onSuccess: () => {
      setIsSuccess(true)
    },
    onError: (error) => {
      console.error(error)
      toast.error('Houve um erro.', { description: 'Não foi possível confirmar a presença.' })
    },
  })

  const onSubmit = (data: AdultGuestFormValues) => {
    confirmAttendance(data)
  }

  if (isSuccess && eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <SuccessStep event={eventData} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-0">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Confirmar Presença de Adulto(s)</CardTitle>
          <CardDescription>
            Preencha seus dados. Se mais alguém for com você, adicione ao grupo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
                  <h3 className="font-semibold text-foreground">
                    {index === 0
                      ? 'Seus Dados (Responsável pelo Grupo)'
                      : `Convidado Adicional ${index}`}
                  </h3>
                  <FormField
                    control={form.control}
                    name={`adultos.${index}.nome`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do convidado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`adultos.${index}.telefone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone/WhatsApp</FormLabel>
                        <FormControl>
                          <PhoneInput placeholder="+55 (XX) 9XXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover convidado</span>
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => append({ nome: '', telefone: '' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar outro adulto ao meu grupo
              </Button>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Presença
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

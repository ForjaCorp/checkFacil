import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { PhoneInput } from '@/components/forms/PhoneInput'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { brazilianPhoneSchema } from '@/lib/phoneUtils'
import api from '@/services/api'

const adultGuestSchema = z.object({
  adultos: z
    .array(
      z.object({
        nome: z.string().trim().min(3, { message: 'O nome é obrigatório.' }),
        telefone: brazilianPhoneSchema,
      }),
    )
    .min(1, 'Pelo menos um adulto deve ser informado.'),
})

type AdultGuestFormValues = z.infer<typeof adultGuestSchema>

interface AddAdultsWalkinFormProps {
  onSuccess: () => void
}

export function AddAdultsWalkinForm({ onSuccess }: AddAdultsWalkinFormProps) {
  const { eventId } = useParams<{ eventId: string }>()

  const form = useForm<AdultGuestFormValues>({
    resolver: zodResolver(adultGuestSchema),
    defaultValues: { adultos: [{ nome: '', telefone: '' }] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adultos',
  })

  const { mutate: confirmAttendance, isPending } = useMutation({
    mutationFn: (data: AdultGuestFormValues) => api.post(`/festa/${eventId}/register-adults`, data),
    onSuccess: () => {
      toast.success('Convidado(s) adicionado(s) com sucesso!')
      onSuccess() // Chama a função para fechar o dialog e atualizar a lista
    },
    onError: (error) => {
      console.error(error)
      let errorMessage = 'Não foi possível adicionar o(s) convidado(s).'
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast.error('Houve um erro.', { description: errorMessage })
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => confirmAttendance(data))}
        className="space-y-6 pt-4"
      >
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
            <h3 className="font-semibold text-foreground">Adulto {index + 1}</h3>
            <FormField
              control={form.control}
              name={`adultos.${index}.nome`}
              render={({ field }) => (
                <FormItem>
                  {' '}
                  <FormLabel>Nome Completo</FormLabel>{' '}
                  <FormControl>
                    <Input placeholder="Nome do convidado" {...field} />
                  </FormControl>{' '}
                  <FormMessage />{' '}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`adultos.${index}.telefone`}
              render={({ field }) => (
                <FormItem>
                  {' '}
                  <FormLabel>Telefone/WhatsApp</FormLabel>{' '}
                  <FormControl>
                    <PhoneInput placeholder="+55 (XX) 9XXXX-XXXX" {...field} />
                  </FormControl>{' '}
                  <FormMessage />{' '}
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
          Adicionar outro adulto
        </Button>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar e Adicionar
        </Button>
      </form>
    </Form>
  )
}

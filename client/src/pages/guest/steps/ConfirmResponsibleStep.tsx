import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { StepHeader } from '@/components/common/StepHeader'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const responsibleStepSchema = z.object({
  responsibleName: z.string().min(3, 'O nome do responsável é obrigatório.'),
  responsiblePhone: brazilianPhoneSchema,
})

export type ResponsibleStepValues = z.infer<typeof responsibleStepSchema>

export interface ConfirmResponsibleStepProps {
  onNext: (data: ResponsibleStepValues) => void
  initialData?: ResponsibleStepValues | null,
  onBack: () => void
}

export function ConfirmResponsibleStep({ onNext, initialData, onBack }: ConfirmResponsibleStepProps) {
  const form = useForm<ResponsibleStepValues>({
    resolver: zodResolver(responsibleStepSchema),
    defaultValues: initialData || { responsibleName: '', responsiblePhone: '' },
  })

  const isPending = form.formState.isSubmitting

  return (
    <Card className="w-full max-w-lg">
      <StepHeader
        title="Contato do Responsável"
        description="Para a segurança das crianças, precisamos de um contato de emergência."
        onBack={onBack}
      />
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
            <FormField
              control={form.control}
              name="responsibleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsiblePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu Telefone/WhatsApp</FormLabel>
                  <FormControl>
                    <PhoneInput placeholder="+55 (XX) 9XXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Continuar para adicionar crianças'
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

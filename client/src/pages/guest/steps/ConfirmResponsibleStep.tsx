import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { ArrowRight, Loader2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { StepHeader } from '@/components/common/StepHeader'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { brazilianPhoneSchema } from '@/lib/phoneUtils'
import api from '@/services/api'

const responsibleStepSchema = z.object({
  responsibleName: z.string().trim().min(3, 'O nome do responsável é obrigatório.'),
  responsiblePhone: brazilianPhoneSchema,
})

export type ResponsibleStepValues = z.infer<typeof responsibleStepSchema>

export interface SavedDependent {
  id: number
  nome: string
  data_nascimento: string
  necessidades_recorrentes?: string[] | null
}

export interface FamilySession {
  token: string
  dependents: SavedDependent[]
  saveProfile: boolean
}

interface Props {
  eventId?: string
  requireVerification?: boolean
  onNext: (data: ResponsibleStepValues, family: FamilySession) => void
  initialData?: ResponsibleStepValues | null
  onBack: () => void
}

const apiErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && typeof error.response?.data?.error === 'string'
    ? error.response.data.error
    : fallback

export function ConfirmResponsibleStep({ eventId, requireVerification = true, onNext, initialData, onBack }: Props) {
  const form = useForm<ResponsibleStepValues>({
    resolver: zodResolver(responsibleStepSchema),
    defaultValues: initialData || { responsibleName: '', responsiblePhone: '' },
    mode: 'onChange',
  })
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [saveProfile, setSaveProfile] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const sendCode = form.handleSubmit(async (data) => {
    setSending(true)
    setError('')
    try {
      await api.post('/familias/otp/solicitar', { telefone: data.responsiblePhone, idFesta: eventId })
      setCodeSent(true)
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Não foi possível enviar o código.'))
    } finally {
      setSending(false)
    }
  })

  const confirmCode = form.handleSubmit(async (data) => {
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Digite o código de 6 números enviado pelo WhatsApp.')
      return
    }
    setSending(true)
    setError('')
    try {
      const response = await api.post('/familias/otp/validar', {
        telefone: data.responsiblePhone,
        nome: data.responsibleName,
        codigo: code,
        consentimento: saveProfile,
        idFesta: eventId,
      })
      const perfil = response.data.perfil
      onNext(
        { responsibleName: perfil.nome || data.responsibleName, responsiblePhone: data.responsiblePhone },
        { token: response.data.token, dependents: perfil.dependentes || [], saveProfile },
      )
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Código inválido ou expirado.'))
    } finally {
      setSending(false)
    }
  })

  return (
    <Card className="mx-auto w-full max-w-lg">
      <StepHeader
        title="Contato do responsável"
        description="Confirme seu WhatsApp para proteger e reaproveitar os dados da sua família."
        onBack={onBack}
      />
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!requireVerification) {
                void form.handleSubmit((data) => onNext(data, { token: '', dependents: [], saveProfile: false }))()
              } else {
                void (codeSent ? confirmCode() : sendCode())
              }
            }}
            className="space-y-5"
          >
            <FormField control={form.control} name="responsibleName" render={({ field }) => (
              <FormItem>
                <FormLabel>Seu nome completo</FormLabel>
                <FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="responsiblePhone" render={({ field }) => (
              <FormItem>
                <FormLabel>Seu telefone/WhatsApp</FormLabel>
                <FormControl><PhoneInput placeholder="+55 (XX) 9XXXX-XXXX" disabled={codeSent} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {requireVerification && codeSent && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <FormLabel htmlFor="family-code">Código recebido</FormLabel>
                  <Input id="family-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    placeholder="000000" className="text-center text-xl tracking-[0.35em]" />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
                  <input type="checkbox" className="mt-1" checked={saveProfile}
                    onChange={(event) => setSaveProfile(event.target.checked)} />
                  <span>Salvar e atualizar os dados da família para facilitar os próximos convites.</span>
                </label>
              </div>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={sending || (requireVerification && !eventId)}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              {!requireVerification ? 'Continuar para adicionar crianças' : codeSent ? 'Confirmar código e continuar' : 'Receber código no WhatsApp'}
              {(!requireVerification || codeSent) && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            {requireVerification && codeSent && <Button type="button" variant="ghost" className="w-full" onClick={() => void sendCode()} disabled={sending}>Reenviar código</Button>}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

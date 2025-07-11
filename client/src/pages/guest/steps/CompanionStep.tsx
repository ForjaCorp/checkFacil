import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Info, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { PhoneInput } from '@/components/forms/PhoneInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { brazilianPhoneSchema } from '@/lib/phoneUtils'
import { type ChildNeedingCompanion } from '@/pages/guest/ConfirmChildrenFlowPage'

const formatNameList = (names: string[]) => {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(' e ')
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

const companionStepSchema = z
  .object({
    companionType: z.enum(['myself', 'other'], {
      required_error: 'Você precisa escolher quem será o acompanhante.',
    }),
    otherCompanionName: z.string().optional(),
    otherCompanionPhone: z.string().optional(),
    isNanny: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.companionType === 'other'
        ? !!data.otherCompanionName && data.otherCompanionName.length >= 3
        : true,
    { message: 'O nome do acompanhante é obrigatório.', path: ['otherCompanionName'] },
  )
  .refine(
    (data) =>
      data.companionType === 'other'
        ? brazilianPhoneSchema.safeParse(data.otherCompanionPhone).success
        : true,
    { message: 'O telefone do acompanhante é inválido.', path: ['otherCompanionPhone'] },
  )

export type CompanionStepValues = z.infer<typeof companionStepSchema>

interface CompanionStepProps {
  onFinalSubmit: (data: CompanionStepValues) => void
  onBack: () => void
  childrenNeedingCompanion: ChildNeedingCompanion[]
  isSubmitting: boolean
  responsibleName?: string | null // Nova propriedade
}

export function CompanionStep({
  onFinalSubmit,
  onBack,
  childrenNeedingCompanion,
  isSubmitting,
  responsibleName, // Nova propriedade
}: CompanionStepProps) {
  const form = useForm<CompanionStepValues>({
    resolver: zodResolver(companionStepSchema),
    defaultValues: { companionType: undefined },
  })

  const watchedCompanionType = form.watch('companionType')

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Acompanhante Obrigatório</CardTitle>
        <CardDescription>
          Para a segurança de{' '}
          <span className="font-semibold text-primary">
            {formatNameList(childrenNeedingCompanion.map((c) => c.name))}
          </span>
          , confirme quem irá acompanhá-las.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
          <h4 className="flex items-center font-semibold text-blue-800 dark:text-blue-200">
            <Info className="mr-2 h-5 w-5" /> Por que isso é necessário?
          </h4>
          <ul className="mt-2 list-disc pl-5 text-sm text-blue-700 dark:text-blue-300">
            {childrenNeedingCompanion.map((child) => (
              <li key={child.name}>
                <span className="font-medium">{child.name}</span>: {child.reason}
              </li>
            ))}
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companionType"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="font-semibold">Quem será o acompanhante?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem>
                        <FormLabel className="font-normal flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                          <FormControl>
                            <RadioGroupItem value="myself" />
                          </FormControl>
                          <span className="flex-1">
                            Eu serei o acompanhante{' '}
                            {responsibleName && (
                              <span className="font-semibold">({responsibleName})</span>
                            )}
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="font-normal flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <div className="flex-1 flex flex-col">
                            <span>Outra pessoa irá como acompanhante</span>
                            <div
                              className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${
                                  watchedCompanionType === 'other'
                                    ? 'mt-4 max-h-96 opacity-100'
                                    : 'max-h-0 opacity-0'
                                }
                              `}
                            >
                              <div className="space-y-4 border-l-2 border-slate-200 pl-6 pt-1 dark:border-slate-700">
                                <FormField
                                  control={form.control}
                                  name="otherCompanionName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">
                                        Nome do Acompanhante
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Nome completo"
                                          className="h-9"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="otherCompanionPhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">
                                        Telefone do Acompanhante
                                      </FormLabel>
                                      <FormControl>
                                        <PhoneInput className="h-9" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="isNanny"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 pt-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm">
                                        Este acompanhante é uma babá profissional?
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              <Button type="button" variant="ghost" onClick={onBack}>
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Finalizar Confirmação'
                )}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

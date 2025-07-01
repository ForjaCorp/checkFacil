import * as z from 'zod'

import { brazilianPhoneSchema } from '@/lib/phoneUtils'

const optionalBrazilianPhoneSchema = z
  .union([z.string().length(0), brazilianPhoneSchema])
  .optional()

/**
 * @file Contém os schemas de validação Zod para os formulários de Convidado.
 */

const guestTypeEnum = z.enum([
  'ADULTO_PAGANTE',
  'CRIANCA_PAGANTE',
  'CRIANCA_ATE_1_ANO',
  'BABA',
  'ANFITRIAO_FAMILIA_DIRETA',
  'ACOMPANHANTE_ATIPICO',
])

export const addGuestSchema = z
  .object({
    nome_convidado: z.string().min(3, { message: 'Nome do convidado é obrigatório.' }),
    tipo_convidado: guestTypeEnum,
    idade_convidado: z.coerce.number().optional().nullable(),
    nascimento_convidado: z.date().optional().nullable(),
    e_crianca_atipica: z.boolean().default(false),
    telefone_convidado: optionalBrazilianPhoneSchema,
    nome_responsavel: z.string().optional().or(z.literal('')),
    telefone_responsavel: optionalBrazilianPhoneSchema,
    nome_acompanhante: z.string().optional().or(z.literal('')),
    telefone_acompanhante: optionalBrazilianPhoneSchema,
    observacao_convidado: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const isChild = data.tipo_convidado.includes('CRIANCA')
    const isAdultOrBaba = data.tipo_convidado === 'ADULTO_PAGANTE' || data.tipo_convidado === 'BABA'

    if (isChild) {
      if (!data.nascimento_convidado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de nascimento é obrigatória para crianças.',
          path: ['nascimento_convidado'],
        })
      }
      if (!data.nome_responsavel || data.nome_responsavel.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nome do responsável é obrigatório para crianças.',
          path: ['nome_responsavel'],
        })
      }
      if (!data.telefone_responsavel || data.telefone_responsavel.length < 13) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone do responsável é obrigatório e deve ser completo.',
          path: ['telefone_responsavel'],
        })
      }
    }

    if (isAdultOrBaba) {
      if (!data.telefone_convidado || data.telefone_convidado.length < 13) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone é obrigatório e deve ser completo para adultos e babás.',
          path: ['telefone_convidado'],
        })
      }
    }

    if (isChild && data.nascimento_convidado) {
      const today = new Date()
      let age = today.getFullYear() - data.nascimento_convidado.getFullYear()
      const m = today.getMonth() - data.nascimento_convidado.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < data.nascimento_convidado.getDate())) {
        age--
      }

      const needsCompanion = age < 6 || data.e_crianca_atipica

      if (needsCompanion) {
        if (!data.nome_acompanhante || data.nome_acompanhante.trim().length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Nome do acompanhante é obrigatório para crianças menores de 6 anos ou atípicas.',
            path: ['nome_acompanhante'],
          })
        }
        if (!data.telefone_acompanhante || data.telefone_acompanhante.length < 13) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Telefone do acompanhante é obrigatório e deve ser completo.',
            path: ['telefone_acompanhante'],
          })
        }
      }
    }
  })

export type AddGuestFormValues = z.infer<typeof addGuestSchema>

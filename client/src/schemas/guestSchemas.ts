import * as z from 'zod'

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
    data_nascimento: z.date().optional().nullable(),
    e_crianca_atipica: z.boolean().default(false),
    telefone_convidado: z.string().optional().or(z.literal('')),
    nome_responsavel: z.string().optional().or(z.literal('')),
    telefone_responsavel: z.string().optional().or(z.literal('')),
    nome_acompanhante: z.string().optional().or(z.literal('')),
    telefone_acompanhante: z.string().optional().or(z.literal('')),
    observacao_convidado: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const isChild = data.tipo_convidado.includes('CRIANCA')

    if (isChild && !data.data_nascimento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de nascimento é obrigatória para crianças.',
        path: ['data_nascimento'],
      })
    }

    if (isChild && (!data.nome_responsavel || data.nome_responsavel.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome do responsável é obrigatório para crianças.',
        path: ['nome_responsavel'],
      })
    }
    if (isChild && (!data.telefone_responsavel || data.telefone_responsavel.length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone do responsável é obrigatório para crianças.',
        path: ['telefone_responsavel'],
      })
    }
    const isAdultOrBaba = data.tipo_convidado === 'ADULTO_PAGANTE' || data.tipo_convidado === 'BABA'
    if (isAdultOrBaba && (!data.telefone_convidado || data.telefone_convidado.length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone é obrigatório para adultos e babás.',
        path: ['telefone_convidado'],
      })
    }
  })

export type AddGuestFormValues = z.infer<typeof addGuestSchema>

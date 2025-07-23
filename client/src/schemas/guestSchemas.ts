import * as z from 'zod'

const phoneSchema = z
  .string()
  .min(10, { message: 'Telefone deve ter no mínimo 10 dígitos' })
  .max(15, { message: 'Telefone deve ter no máximo 15 dígitos' })
  .regex(/^\d+$/, { message: 'Apenas números são permitidos' })
  .optional()
  .nullable()

export const editGuestSchema = z
  .object({
    nome_convidado: z.string().min(3, { message: 'Nome do convidado é obrigatório.' }),
    tipo_convidado: z.string().optional(),
    telefone_convidado: phoneSchema,
    telefone_responsavel: phoneSchema,
    telefone_acompanhante: phoneSchema,
    nome_responsavel: z.string().optional().nullable(),
    nome_acompanhante: z.string().optional().nullable(),
    nascimento_convidado: z.union([z.string(), z.date()]).optional().nullable(),
    e_crianca_atipica: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Para adultos, telefone_convidado é obrigatório
      const isAdult = data.tipo_convidado === 'ADULTO_PAGANTE' || 
                     data.tipo_convidado === 'BABA' || 
                     data.tipo_convidado === 'ANFITRIAO_FAMILIA_DIRETA' ||
                     data.tipo_convidado === 'ACOMPANHANTE_ATIPICO'
      
      if (isAdult) {
        return Boolean(data.telefone_convidado?.trim())
      }
      return true
    },
    {
      message: 'Telefone é obrigatório para adultos',
      path: ['telefone_convidado'],
    }
  )
  .refine(
    (data) => {
      // Para crianças, telefone_responsavel é obrigatório
      const isChild = data.tipo_convidado?.includes('CRIANCA')
      
      if (isChild) {
        return Boolean(data.telefone_responsavel?.trim())
      }
      return true
    },
    {
      message: 'Telefone do responsável é obrigatório para crianças',
      path: ['telefone_responsavel'],
    }
  )

export type EditGuestFormValues = z.infer<typeof editGuestSchema>

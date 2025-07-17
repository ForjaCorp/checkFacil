import * as z from 'zod'

export const editGuestSchema = z.object({
  nome_convidado: z.string().min(3, { message: 'Nome do convidado é obrigatório.' }),
  nascimento_convidado: z.union([z.string(), z.date()]).optional().nullable(),
  e_crianca_atipica: z.boolean().default(false),
})

export type EditGuestFormValues = z.infer<typeof editGuestSchema>

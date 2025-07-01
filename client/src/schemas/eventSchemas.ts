import * as z from 'zod'

import { brazilianPhoneSchema } from '@/lib/phoneUtils'

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).')

/**
 * @file Contém os schemas de validação Zod para os formulários de Festa/Evento.
 */

// Schema base para o rascunho da festa, usado pelo Staff.
export const createDraftFormSchema = z.object({
  organizerName: z.string().min(1, 'Nome do contratante é obrigatório.'),
  organizerEmail: z
    .string()
    .min(1, 'Email do contratante é obrigatório.')
    .email('Formato de email inválido.'),
  organizerPhone: brazilianPhoneSchema,
  partyName: z.string().min(1, 'Um nome para a festa é obrigatório.'),
  partyDate: z.date({ required_error: 'Data da festa é obrigatória.' }),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  packageType: z.enum(
    ['KIDS', 'KIDS_MAIS_PARK', 'PLAY', 'PLAY_MAIS_PARK', 'SUPER_FESTA_COMPLETA'],
    { required_error: 'Você precisa selecionar um tipo de pacote.' },
  ),
  contractedChildren: z.coerce.number().int().positive({ message: 'Deve ser um número positivo.' }),
  contractedAdults: z.coerce.number().int().positive({ message: 'Deve ser um número positivo.' }),
})

// Schema para a página de detalhes completos, que estende o rascunho.
export const completeDetailsSchema = createDraftFormSchema.extend({
  description: z.string().optional().or(z.literal('')),
  birthdayPersonName: z.string().min(1, 'Nome do aniversariante é obrigatório.'),
  birthdayPersonAge: z.coerce.number().int().positive('Idade inválida.').optional().nullable(),
  partyTheme: z.string().optional().or(z.literal('')),
  isDropOffParty: z.boolean().default(false),
  allowsImageUse: z.boolean().default(false),
  clientInstagram: z.string().optional().or(z.literal('')),
  guestNotInListPolicy: z
    .enum(['PERMITIR_ANOTAR', 'CHAMAR_ANFITRIAO'], { message: 'Procedimento inválido.' })
    .optional()
    .or(z.literal('')),
  spotifyPlaylistLink: z
    .string()
    .url({ message: 'Por favor, insira uma URL válida.' })
    .optional()
    .or(z.literal('')),
  partyObservations: z.string().optional().or(z.literal('')),
})

// Tipos inferidos a partir dos schemas para uso nos componentes
export type CreateDraftFormValues = z.infer<typeof createDraftFormSchema>
export type CompleteDetailsFormValues = z.infer<typeof completeDetailsSchema>

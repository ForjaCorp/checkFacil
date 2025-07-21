import * as z from 'zod'

import { brazilianPhoneSchema } from '@/lib/phoneUtils'

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).')
  .min(1, 'Horário é obrigatório')
  .or(z.literal(''))
  .transform(val => val || undefined)

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
    ['KIDS', 'KIDS_MAIS_PARK', 'PLAY', 'PLAY_MAIS_PARK', 'KIDS_PARK_PLAY'],
    { required_error: 'Você precisa selecionar um tipo de pacote.' },
  ),
  contractedGuests: z.coerce.number({
    required_error: 'Por favor, informe o número total de convidados.',
    invalid_type_error: 'O número de convidados deve ser um número.'
  }).int('O número de convidados deve ser um número inteiro.')
  .positive('O número de convidados deve ser maior que zero.')
  .min(1, 'O número de convidados deve ser maior que zero.'),
})

export const completeDetailsSchema = createDraftFormSchema
  .extend({
    description: z.string().optional().or(z.literal('')),
    birthdayPersonName: z.string().min(1, 'Nome do aniversariante é obrigatório.'),
    birthdayPersonAge: z.coerce.number().int().positive('Idade inválida.').optional().nullable(),
    partyTheme: z.string().optional().or(z.literal('')),
    isDropOffParty: z.boolean().default(false),
    allowsImageUse: z.boolean().default(false),
    clientInstagram: z.string().optional().or(z.literal('')),
    guestNotInListPolicy: z
      .enum(['PERMITIR_ANOTAR', 'CHAMAR_ANFITRIAO'])
      .nullable()
      .optional()
      .or(z.literal('')),
    spotifyPlaylistLink: z
      .string()
      .url({ message: 'Por favor, insira uma URL válida.' })
      .optional()
      .or(z.literal('')),
    partyObservations: z.string().optional().or(z.literal('')),
    // Campos de fornecedores
    decoradorNome: z.string().optional().or(z.literal('')),
    decoradorContato: z.string().optional().or(z.literal('')),
    temMaterialTerceirizado: z.boolean().default(false),
    materialTerceirizadoContato: z.string().optional().or(z.literal('')),
    localDecoracao: z.enum(['PLAY', 'CASINHAS', 'ENTRE_CASINHAS', 'KIDS', 'SALAO_DE_FESTAS']).optional().or(z.literal('')),
    buffetNome: z.string().optional().or(z.literal('')),
    buffetContato: z.string().optional().or(z.literal('')),
    bebidasFornecedorNome: z.string().optional().or(z.literal('')),
    bebidasFornecedorContato: z.string().optional().or(z.literal('')),
    fornecedorExtraNome: z.string().optional().or(z.literal('')),
    fornecedorExtraContato: z.string().optional().or(z.literal('')),
  })
  .omit({
    organizerName: true,
    organizerEmail: true,
    organizerPhone: true,
  })

export type CreateDraftFormValues = z.infer<typeof createDraftFormSchema>
export type CompleteDetailsFormValues = z.infer<typeof completeDetailsSchema>

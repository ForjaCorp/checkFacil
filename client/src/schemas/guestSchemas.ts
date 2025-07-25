import * as z from 'zod'

// CORREÇÃO: Schema de telefone verdadeiramente opcional.
// As regras de formato só se aplicam se o campo não estiver vazio.
const optionalPhoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      // Se o valor for nulo, indefinido ou vazio, é válido.
      if (!val) return true
      // Se houver um valor, ele deve ser apenas números e ter o tamanho correto.
      const justDigits = val.replace(/\D/g, '')
      return justDigits.length >= 10 && justDigits.length <= 15
    },
    {
      // Mensagem de erro que só aparecerá se o usuário digitar algo inválido.
      message: 'Telefone inválido. Deve conter entre 10 e 15 dígitos.',
    },
  )

export const editGuestSchema = z
  .object({
    nome_convidado: z.string().min(3, { message: 'Nome do convidado é obrigatório.' }),
    tipo_convidado: z.string().optional(),
    
    
    telefone_convidado: optionalPhoneSchema,
    telefone_responsavel: optionalPhoneSchema,
    telefone_acompanhante: optionalPhoneSchema, 

    nome_responsavel: z.string().optional().nullable(),
    nome_acompanhante: z.string().optional().nullable(),
    nascimento_convidado: z.union([z.string(), z.date()]).optional().nullable(),
    e_crianca_atipica: z.boolean().default(false),
  })
 
  .refine(
    (data) => {
     
      const isAdultType =
        data.tipo_convidado === 'ADULTO_PAGANTE' ||
        data.tipo_convidado === 'BABA' ||
        data.tipo_convidado === 'ANFITRIAO_FAMILIA_DIRETA' ||
        data.tipo_convidado === 'ACOMPANHANTE_ATIPICO'

      if (isAdultType) {
        
        return !!data.telefone_convidado
      }
      return true
    },
    {
      message: 'Telefone é obrigatório para este tipo de convidado.',
      path: ['telefone_convidado'], // O erro aparecerá no campo correto
    },
  )
  .refine(
    (data) => {
      // Para crianças, nome e telefone do responsável são obrigatórios
      const isChild = data.tipo_convidado?.includes('CRIANCA')
      if (isChild) {
        return !!data.nome_responsavel && !!data.telefone_responsavel
      }
      return true
    },
    {
      // Como a validação depende de dois campos, a mensagem pode ser genérica
      // ou podemos criar dois `.refine` separados. Para manter simples:
      message: 'Nome e telefone do responsável são obrigatórios para crianças.',
      // Aponta o erro para o primeiro campo relevante
      path: ['nome_responsavel'],
    },
  )

export type EditGuestFormValues = z.infer<typeof editGuestSchema>